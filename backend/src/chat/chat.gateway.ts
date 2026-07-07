import { HttpException, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { I18nService } from 'nestjs-i18n';
import type { Server, Socket } from 'socket.io';
import type { CurrentUserPayload } from '../auth/current-user.interface';
import { ChatService } from './chat.service';

type SocketWithUser = Socket & { data: { user?: CurrentUserPayload } };

// Dekorator @WebSocketGateway służy do oznaczenia klasy jako bramy WebSocket w NestJS.
// Tworzy on serwer Socket.IO na podanej ścieżce i z określonymi ustawieniami CORS.
// Dzięki temu klasa może obsługiwać połączenia i zdarzenia WebSocket.
@WebSocketGateway({
  // Domyślna ścieżka Socket.IO; wpisana jawnie, żeby była spójna z Caddyfile.
  path: '/socket.io',
  cors: { origin: true, credentials: true },
})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly messageWindowBySocket = new Map<string, number[]>();

  // To pole dekorowane @WebSocketServer() wstrzykuje instancję serwera Socket.IO (typ Server).
  // Pozwala to emitować zdarzenia do wszystkich klientów z poziomu tego gatewaya.
  // Tak, dekorator @WebSocketGateway tworzy i zarządza instancją serwera Socket.IO.
  // Pole zadeklarowane jako @WebSocketServer() pozwala wstrzyknąć tę instancję do klasy gatewaya.
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly i18n: I18nService,
  ) {}

  // handleConnection jest wywoływana, gdy klient się połączy z serwerem WebSocket (socket.connect()).
  // Tutaj sprawdzamy, czy użytkownik jest autentyczny i czy ma dostęp do zamówienia.
  // Jeśli nie, rozłączamy klienta.
  // Argument client w handleConnection jest przekazywany automatycznie przez NestJS,
  // ponieważ klasa ChatGateway implementuje interfejs OnGatewayConnection.
  // Gdy klient łączy się przez WebSocket, NestJS wywołuje handleConnection
  // i przekazuje jako argument instancję Socket z pakietu socket.io.
  // NIE, client i server to NIE to samo.
  // server (pole oznaczone @WebSocketServer()) to instancja serwera Socket.IO, służąca do emitowania wiadomości i zarządzania połączeniami globalnie.
  // client to konkretny socket/połączenie pojedynczego klienta (użytkownika), reprezentujący daną sesję użytkownika po stronie backendu.
  async handleConnection(client: SocketWithUser) {
    try {
      client.data.user = await this.chatService.authenticateSocket(client);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.messageWindowBySocket.delete(client.id);
  }

  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() payload: { orderId?: string },
  ) {
    const user = await this.resolveSocketUser(client);
    const orderId = payload?.orderId;

    if (!user || !orderId || typeof orderId !== 'string') {
      client.emit('chat:error', {
        message: this.i18n.t('messages.chatInvalidJoin'),
      });
      return;
    }

    try {
      await this.chatService.assertCanAccessOrder(user, orderId);
      // Tutaj dołączamy klienta do pokoju WebSocket odpowiadającego zamówieniu.
      // Dzięki temu klient będzie otrzymywać wiadomości czatu dotyczące tego konkretnego zamówienia.
      // Metoda roomForOrder(orderId) zwraca nazwę pokoju w formacie, np. "order:123".
      // Metoda join powoduje, że socket klienta "wchodzi" do tego pokoju.
      // To umożliwia późniejsze emitowanie wiadomości tylko do osób należących do tego pokoju (czyli do uczestników czatu zamówienia).
      const roomName = this.chatService.roomForOrder(orderId);
      await client.join(roomName);
    } catch (err) {
      // Wysłanie komunikatu o błędzie (np. brak dostępu)
      client.emit('chat:error', {
        message: this.getErrorMessage(err, this.i18n.t('messages.forbidden')),
      });
    }
  }

  // Dekorator @SubscribeMessage('chat:send') oznacza, że metoda poniżej reaguje na zdarzenie o nazwie 'chat:send' wysyłane przez klienta przez WebSocket.
  // Dzięki temu, kiedy klient wyśle wiadomość 'chat:send', zostanie uruchomiona odpowiednia metoda na serwerze.
  @SubscribeMessage('chat:send')
  async handleSend(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody()
    payload: { orderId?: string; content?: string; clientMessageId?: string },
  ) {
    const user = await this.resolveSocketUser(client);
    const orderId = payload?.orderId;
    const content =
      typeof payload?.content === 'string' ? payload.content.trim() : '';

    if (!user || !orderId || typeof orderId !== 'string') {
      client.emit('chat:error', {
        message: this.i18n.t('messages.chatInvalidMessage'),
      });
      return;
    }

    try {
      await this.chatService.assertCanAccessOrder(user, orderId);
    } catch (err) {
      client.emit('chat:error', {
        message: this.getErrorMessage(err, this.i18n.t('messages.forbidden')),
      });
      return;
    }

    if (!content || content.length > 1000) {
      client.emit('chat:error', {
        message: this.i18n.t('messages.chatContentInvalid'),
      });
      return;
    }

    const now = Date.now();
    const timestamps = (this.messageWindowBySocket.get(client.id) ?? []).filter(
      (t) => now - t < 60_000,
    );
    if (timestamps.length >= 20) {
      client.emit('chat:error', {
        message: this.i18n.t('messages.chatRateLimitExceeded'),
      });
      return;
    }
    timestamps.push(now);
    this.messageWindowBySocket.set(client.id, timestamps);

    try {
      const message = await this.chatService.createMessage({
        orderId,
        senderUserId: user.id,
        content,
      });

      this.server
        .to(this.chatService.roomForOrder(orderId))
        .emit('chat:message', {
          ...message,
          clientMessageId:
            typeof payload?.clientMessageId === 'string'
              ? payload.clientMessageId
              : null,
        });
    } catch (err) {
      this.logger.error('Failed to send chat message', err);
      client.emit('chat:error', {
        message: this.i18n.t('messages.chatSendFailed'),
      });
    }
  }

  private async resolveSocketUser(
    client: SocketWithUser,
  ): Promise<CurrentUserPayload | undefined> {
    if (client.data.user) {
      return client.data.user;
    }

    try {
      const user = await this.chatService.authenticateSocket(client);
      client.data.user = user;
      return user;
    } catch {
      return undefined;
    }
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpException) {
      const response = err.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message[0] : message;
      }
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  }
}

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fetchChatMessages } from "@/api/chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/apiClient";
import { getAuthToken } from "@/lib/auth-token";
import { formatDateTime } from "@/lib/format-date";
import {
  connectSocketWithAuth,
  connectSocketWithAuthAndWait,
} from "@/lib/socket";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/lib/locale";
import type { ChatMessage } from "@/types/chat";

type OrderChatProps = {
  orderId: string;
  locale: AppLocale;
  currentUserId?: string | null;
};

function OrderChat({ orderId, locale, currentUserId }: OrderChatProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(
    () => draft.trim().length > 0 && draft.trim().length <= 1000 && !sending,
    [draft, sending],
  );

  useEffect(() => {
    let mounted = true;
    const token = getAuthToken();
    if (!token || token === "EXPIRED") {
      setError(t("orderChat.loginRequired"));
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    fetchChatMessages(orderId, locale, controller.signal)
      .then((data) => {
        if (mounted) {
          setMessages(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!mounted || controller.signal.aborted) return;
        const message =
          err instanceof ApiError ? err.message : t("orderChat.loadFailed");
        setError(message);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [orderId, locale, t]);

  useEffect(() => {
    let cancelled = false;
    let socket: ReturnType<typeof connectSocketWithAuth> | null = null;

    // message jest przekazywane tutaj automatycznie jako pierwszy argument przez handler socket.on:
    // socket.on("chat:message", onMessage);
    // Oznacza to, że gdy serwer wyemituje zdarzenie 'chat:message', dane przesłane z serwera (pojedynczy obiekt ChatMessage)
    // zostaną przekazane do funkcji onMessage jako argument 'message'.
    const onMessage = (message: ChatMessage) => {
      if (message.orderId !== orderId) return;
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
      setSending(false);
    };

    const onError = (payload: { message?: string }) => {
      if (payload?.message) {
        setError(payload.message);
        toast.error(payload.message);
      }
      setSending(false);
    };

    const joinRoom = () => {
      socket?.emit("chat:join", { orderId });
    };

    const setupSocket = async () => {
      try {
        // socket to obiekt połączenia WebSocket, używany tutaj do komunikacji z serwerem w czasie rzeczywistym.
        // Otrzymujemy go przez funkcję connectSocketWithAuthAndWait, która zwraca połączone i uwierzytelnione połączenie.
        socket = await connectSocketWithAuthAndWait();
        if (cancelled) return;

        socket.on("chat:message", onMessage);
        socket.on("chat:error", onError);
        socket.on("connect", joinRoom);
        joinRoom();
      } catch {
        if (!cancelled) {
          setError(t("orderChat.loginRequired"));
        }
      }
    };

    void setupSocket();

    return () => {
      cancelled = true;
      socket?.off("chat:message", onMessage);
      socket?.off("chat:error", onError);
      socket?.off("connect", joinRoom);
    };
  }, [orderId, t]);

  // Ten useEffect automatycznie przewija widok czatu do najnowszej wiadomości za każdym razem, gdy zmienia się lista wiadomości (messages).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || content.length > 1000) return;

    try {
      const socket = connectSocketWithAuth();
      setSending(true);
      setError(null);
      socket.emit("chat:send", {
        orderId,
        content,
        clientMessageId: crypto.randomUUID(),
      });
      setDraft("");
    } catch {
      setError(t("orderChat.loginRequired"));
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) handleSend();
    }
  };

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("orderChat.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("orderChat.loading")}
          </p>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("orderChat.empty")}
              </p>
            ) : (
              messages.map((message) => {
                const own = currentUserId
                  ? message.sender.id === currentUserId
                  : false;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      own
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs",
                        own
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {message.sender.name}
                      {message.sender.isAdmin
                        ? ` (${t("orderChat.adminBadge")})`
                        : ""}
                      {" · "}
                      {formatDateTime(message.createdAt).slice(0, 17)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("orderChat.placeholder")}
            className={cn(inputClass, "min-h-10 flex-1 resize-none")}
            maxLength={1000}
            rows={2}
            disabled={loading}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!canSend || loading}
            className="self-end"
          >
            {sending ? t("orderChat.sending") : t("orderChat.send")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default OrderChat;

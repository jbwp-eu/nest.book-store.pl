import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/auth-token";
import { env } from "@/lib/env";

function getSocketUrl(): string {
  try {
    return new URL(env.backendUrl).origin;
  } catch {
    return "http://localhost:3004";
  }
}

let socketSingleton: Socket | null = null;

export function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io(getSocketUrl(), {
      // Domyślna ścieżka Socket.IO; wpisana jawnie, spójnie z backendem i Caddyfile.
      path: "/socket.io",
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  return socketSingleton;
}

export function connectSocketWithAuth(): Socket {
  const token = getAuthToken();
  if (!token || token === "EXPIRED") {
    throw new Error("Not authenticated");
  }

  const socket = getSocket();
  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function waitForSocketConnection(socket: Socket): Promise<Socket> {
  // Funkcja sprawdza, czy socket jest już połączony.
  // Jeśli tak, od razu zwraca resolved Promise z tym socketem.
  if (socket.connected) {
    return Promise.resolve(socket);
  }
  // W przeciwnym razie ustawia nasłuchiwanie na eventy 'connect' i 'connect_error'.
  // Zwraca Promise, który rozwiązuje się po połączeniu lub odrzuca w przypadku błędu.
  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    const onConnectError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
  });
}

export async function connectSocketWithAuthAndWait(): Promise<Socket> {
  const socket = connectSocketWithAuth();
  return waitForSocketConnection(socket);
}

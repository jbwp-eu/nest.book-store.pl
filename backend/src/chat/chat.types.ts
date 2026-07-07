export type ChatMessageResponse = {
  id: string;
  orderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
  clientMessageId?: string | null;
};

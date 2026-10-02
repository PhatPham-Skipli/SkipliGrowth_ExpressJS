export interface ServerToClientEvents {
  // Order & Escrow Events
  'order:funded': (payload: {
    orderId: string;
    orderNumber: string;
    amount: number;
  }) => void;
  'order:paid': (payload: { orderId: string; orderNumber: string }) => void;
}

export interface ClientToServerEvents {
  [event: string]: (...args: unknown[]) => void;
}

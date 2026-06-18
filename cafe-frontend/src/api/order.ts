const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface OrderItemInput {
  item_id: number;
  quantity: number;
}

export interface PlaceOrderInput {
  cafe_slug: string;
  table_number: string;
  items: OrderItemInput[];
  customer_note?: string;
}

export interface PlaceOrderResponse {
  message: string;
  order_id: number;
  table_number: string;
  total_amount: number;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
  const response = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<PlaceOrderResponse>;
}

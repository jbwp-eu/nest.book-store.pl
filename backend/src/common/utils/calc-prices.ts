export function round2(value: number | string): number {
  if (typeof value === 'number') {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  if (typeof value === 'string') {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }
  throw new Error('Value is not a number or string');
}

export interface CalcPricesItem {
  price: number;
  quantity: number;
}

export interface CalcPricesResult {
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: string;
}

export function calcPrices(
  orderItems: CalcPricesItem[],
  taxRate: number,
): CalcPricesResult {
  const itemsPrice = round2(
    orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  const shippingPrice = round2(itemsPrice > 200 ? 0 : 20);

  const taxPrice = round2(taxRate * itemsPrice);

  const totalPrice = (
    Number(itemsPrice) +
    Number(shippingPrice) +
    Number(taxPrice)
  ).toFixed(2);

  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}

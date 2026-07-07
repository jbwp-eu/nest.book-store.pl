import { calcPrices } from './calc-prices';

describe('calcPrices', () => {
  it('charges shipping when items total is 200 or less', () => {
    expect(calcPrices([{ price: 100, quantity: 2 }], 0)).toEqual({
      itemsPrice: 200,
      shippingPrice: 20,
      taxPrice: 0,
      totalPrice: '220.00',
    });
  });

  it('waives shipping when items total is above 200', () => {
    expect(calcPrices([{ price: 150, quantity: 2 }], 0)).toEqual({
      itemsPrice: 300,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: '300.00',
    });
  });
});

import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../../orders/order.entity';
import { OrderConfirmationQueueService } from './order-confirmation-queue.service';

const send = jest.fn();

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn(() => ({ send })),
  SendMessageCommand: jest.fn((input: unknown) => input),
}));

describe('OrderConfirmationQueueService', () => {
  let service: OrderConfirmationQueueService;

  const orderRepository = {
    findOne: jest.fn(),
  };

  const configGet = jest.fn();

  beforeEach(async () => {
    send.mockReset();
    send.mockResolvedValue({});
    orderRepository.findOne.mockReset();
    configGet.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderConfirmationQueueService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    service = module.get(OrderConfirmationQueueService);
  });

  const sampleOrder = {
    id: 'order-1',
    itemsPrice: 49.99,
    shippingPrice: 10,
    totalPrice: 59.99,
    paidAt: new Date('2026-07-07T12:00:00.000Z'),
    shippingAddress: {
      address: 'ul. Test 1',
      city: 'Warszawa',
      code: '00-001',
    },
    User: {
      name: 'Jan Kowalski',
      email: 'jan@example.com',
    },
    OrderItems: [
      {
        title: 'Aptekarka',
        quantity: 1,
        price: 49.99,
      },
    ],
  };

  it('isConfigured returns false when queue URL is unset', () => {
    configGet.mockReturnValue(undefined);
    expect(service.isConfigured()).toBe(false);
  });

  it('tryEnqueue returns false when queue URL is unset', async () => {
    configGet.mockReturnValue(undefined);
    await expect(service.tryEnqueue('order-1')).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('enqueues message with expected shape when queue URL is set', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === 'ORDER_CONFIRMATION_QUEUE_URL') {
        return 'https://sqs.eu-central-1.amazonaws.com/123/nest-book-store-order-confirmation';
      }
      if (key === 'AWS_REGION') return 'eu-central-1';
      if (key === 'TO_3') return 'admin@test.pl';
      return undefined;
    });
    orderRepository.findOne.mockResolvedValue(sampleOrder);

    await expect(service.tryEnqueue('order-1')).resolves.toBe(true);

    expect(send).toHaveBeenCalledTimes(1);
    const input = send.mock.calls[0][0] as {
      QueueUrl: string;
      MessageBody: string;
    };
    expect(input.QueueUrl).toBe(
      'https://sqs.eu-central-1.amazonaws.com/123/nest-book-store-order-confirmation',
    );
    const body = JSON.parse(input.MessageBody);
    expect(body).toMatchObject({
      orderId: 'order-1',
      userEmail: 'jan@example.com',
      userName: 'Jan Kowalski',
      itemsPrice: 49.99,
      shippingPrice: 10,
      totalPrice: 59.99,
      adminEmail: 'admin@test.pl',
      language: 'pl',
    });
    expect(body.items).toHaveLength(1);
    expect(body.shippingAddress.city).toBe('Warszawa');
  });

  it('enqueues language en when tryEnqueue is called with en', async () => {
    configGet.mockImplementation((key: string) => {
      if (key === 'ORDER_CONFIRMATION_QUEUE_URL') {
        return 'https://sqs.eu-central-1.amazonaws.com/123/nest-book-store-order-confirmation';
      }
      if (key === 'AWS_REGION') return 'eu-central-1';
      return undefined;
    });
    orderRepository.findOne.mockResolvedValue(sampleOrder);

    await expect(service.tryEnqueue('order-1', 'en')).resolves.toBe(true);

    const input = send.mock.calls[0][0] as { MessageBody: string };
    expect(JSON.parse(input.MessageBody).language).toBe('en');
  });
});

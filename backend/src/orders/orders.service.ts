import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, In } from 'typeorm';
import { CurrentUserPayload } from '../auth/current-user.interface';
import { calcPrices } from '../common/utils/calc-prices';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';

interface PreparedOrderItem {
  title: string;
  images: string[];
  quantity: number;
  product: string;
  price: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectDataSource()
    /**
     * Używamy DataSource zamiast OrdersRepository, ponieważ:
     * - DataSource daje dostęp do zaawansowanych operacji, takich jak transakcje oraz możliwość pobrania repozytoriów dla różnych encji w czasie rzeczywistym.
     * - Proces tworzenia zamówienia (create) wymaga pracy z wieloma encjami (Order, OrderItem, Product), a obsługa całości w ramach jednej transakcji zapewnia spójność danych.
     * - Transakcje wykonywane przez DataSource pozwalają na wykonanie wielu zapytań (do wielu repozytoriów) i pełny rollback w przypadku błędu.
     * - Repository<Order> sprawdzi się wtedy, gdy obsługujemy tylko pojedynczą encję (Order) i nie potrzebujemy zaawansowanej obsługi transakcji obejmującej różne tabele.
     */
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Metoda create obsługuje proces tworzenia zamówienia.
   * 
   * Ważne: this.dataSource to instancja klasy DataSource z pakietu TypeORM, 
   * która zapewnia połączenie i operacje na bazie danych w obrębie aplikacji NestJS.
   * Umożliwia m.in. uruchamianie transakcji, dostęp do repozytoriów (getRepository), 
   * a także wykonywanie zapytań czy zapisywanie/aktualizowanie rekordów.
   * Dzięki użyciu metody this.dataSource.transaction, cała logika tworzenia zamówienia 
   * wykonywana jest w ramach jednej transakcji - jeśli którykolwiek etap się nie uda, 
   * cała operacja zostaje wycofana (rollback).
   */
  async create(dto: CreateOrderDto, user: CurrentUserPayload) {
    // Pobranie produktów z bazy na podstawie identyfikatorów przesłanych w zamówieniu
    const products = await this.dataSource.getRepository(Product).find({
      where: { id: In(dto.orderItems.map((item) => item.id)) },
    });

    // Mapowanie elementów zamówienia klienta na dane do bazy, z weryfikacją istnienia produktów
    const dbOrderItems: PreparedOrderItem[] = dto.orderItems.map(
      (itemFromClient) => {
        const matchingProduct = products.find(
          (product) => product.id === itemFromClient.id,
        );

        if (!matchingProduct) {
          throw new UnauthorizedException(
            this.i18n.t('messages.failedToVerifyPayment'),
          );
        }

        return {
          title: itemFromClient.title,
          images: itemFromClient.images,
          quantity: itemFromClient.quantity,
          product: itemFromClient.id,
          price: Number(matchingProduct.price),
        };
      },
    );

    // Wyliczenie cen z podatkiem
    const taxRate = this.configService.get<number>('TAX', 0);
    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcPrices(
      dbOrderItems,
      taxRate,
    );

    // Przeprowadzenie transakcji: zapis zamówienia, pozycji zamówienia oraz aktualizacja stanów magazynowych
    // "manager" to instancja EntityManager z TypeORM, która zapewnia interfejs do wykonywania operacji na bazie danych (np. wstawianie, wyszukiwanie, aktualizowanie, usuwanie rekordów) w obrębie jednej transakcji.
    // Dzięki niej wszystkie zapytania wykonywane w funkcji przekazanej do .transaction() są traktowane jako jedna transakcja - jeśli którykolwiek etap się nie powiedzie, cała operacja zostaje wycofana.
    const createdOrder = await this.dataSource.transaction(async (manager) => {
      // Tworzenie rekordu zamówienia
      const orderResult = await manager.insert(Order, {
        shippingAddress: dto.shippingAddress,
        paymentMethod: dto.paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice: Number(totalPrice),
        User: { id: user.id },
      });

      const orderId = orderResult.identifiers[0].id as string;

      // Tworzenie pozycji zamówienia i aktualizacja dostępności w magazynie produktu
      for (const item of dbOrderItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.product },
        });

        if (!product) {
          throw new BadRequestException(
            this.i18n.t('messages.productNotFound'),
          );
        }

        if (product.countInStock - item.quantity < 0) {
          throw new BadRequestException(
            this.i18n.t('messages.insufficientStock', {
              args: { title: item.title },
            }),
          );
        }

        await manager.insert(OrderItem, {
          title: item.title,
          images: item.images,
          quantity: item.quantity,
          product: item.product,
          price: item.price,
          order: { id: orderId },
        });

        product.countInStock -= item.quantity;
        await manager.save(product);
      }

      // Zwrócenie utworzonego zamówienia wraz z powiązanymi pozycjami
      return manager.findOne(Order, {
        where: { id: orderId },
        relations: { OrderItems: true },
      });
    });

    return {
      createdOrder,
      message: this.i18n.t('messages.orderCreated'),
    };
  }

  async findMine(user: CurrentUserPayload) {
    const orders = await this.dataSource.getRepository(Order).find({
      where: { User: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    if (orders.length === 0) {
      throw new NotFoundException(this.i18n.t('messages.ordersNotFound'));
    }

    return orders;
  }

  async findById(id: string) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id },
      relations: { OrderItems: true },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    return order;
  }

  async findAll(query: GetOrdersQueryDto) {
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);
    const page = this.parsePage(query.pageNumber);

    const [orders, count] = await this.dataSource
      .getRepository(Order)
      .findAndCount({
        take: pageSize,
        skip: pageSize * (page - 1),
        relations: { User: true },
        order: { createdAt: 'DESC' },
      });

    if (orders.length === 0) {
      throw new NotFoundException(this.i18n.t('messages.ordersNotFound'));
    }

    return {
      orders,
      pages: Math.ceil(count / pageSize),
    };
  }

  async markDelivered(id: string) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();
    await this.dataSource.getRepository(Order).save(order);

    return {
      message: this.i18n.t('messages.orderDelivered'),
    };
  }

  async remove(id: string) {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    await this.dataSource.getRepository(Order).remove(order);

    return {
      message: this.i18n.t('messages.orderDeleted'),
    };
  }

  private parsePage(pageNumber?: string): number {
    if (!pageNumber || pageNumber === 'undefined' || !Number(pageNumber)) {
      return 1;
    }
    return Number(pageNumber);
  }
}

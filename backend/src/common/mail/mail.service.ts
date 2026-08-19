import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { Order } from '../../orders/order.entity';

export type MailLanguage = 'pl' | 'en';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async sendPurchaseReceipt(
    orderId: string,
    language: MailLanguage = 'pl',
  ): Promise<{ message: string }> {
    const lang = language === 'en' ? 'en' : 'pl';
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { User: true, OrderItems: true },
    });

    if (!order) {
      throw new NotFoundException(
        this.t('messages.orderNotFound', lang),
      );
    }

    const domain = this.configService.get<string>('DOMAIN');
    const toAdmin = this.configService.get<string>('TO_3');
    const storeName =
      this.configService.get<string>('STORE_NAME')?.trim() || 'BookStore';
    const { subject, text, html } = this.buildReceiptContent(
      order,
      lang,
      storeName,
    );

    const to = toAdmin?.trim()
      ? `<${order.User.email}>,<${toAdmin}>`
      : `<${order.User.email}>`;

    await this.createTransporter().sendMail({
      from: `"${storeName}" <nest@${domain}>`,
      to,
      subject,
      text,
      html,
    });

    return {
      message: this.t('messages.paymentSuccessful', lang),
    };
  }

  async sendContactMessage(
    email: string,
    text: string,
  ): Promise<{ messageId: string }> {
    const domain = this.configService.get<string>('DOMAIN');
    const to1 = this.configService.get<string>('TO_1');
    const to2 = this.configService.get<string>('TO_2');

    const info = await this.createTransporter().sendMail({
      from: `"BookStore Customer👻"<nest@${domain}>`,
      to: `<${to1}>,<${to2}>`,
      subject: `Od (email): ${email}`,
      text: `Wiadomość: ${text}`,
    });

    return { messageId: info.messageId };
  }

  private t(
    key: string,
    lang: MailLanguage,
    args?: Record<string, string | number>,
  ): string {
    return this.i18n.t(key, { lang, args });
  }

  private createTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '465'));
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(port !== 465 && { requireTLS: true }),
      auth: {
        user: smtpUser,
        pass: password,
      },
    });
  }

  private money(value: number): string | null {
    return Number.isFinite(value) ? value.toFixed(2) : null;
  }

  private formatItems(
    items: Array<{ title: string; quantity: number; price: number }>,
    currency: string,
  ): string {
    return items
      .map((item) => {
        const title = String(item.title ?? 'Item');
        const qty = Number(item.quantity ?? 0);
        const price = Number(item.price ?? 0);
        return `  - ${title} x${qty} @ ${price.toFixed(2)} ${currency}`;
      })
      .join('\n');
  }

  private formatAddress(addr: {
    address?: string;
    city?: string;
    code?: string;
  }): string {
    const cityLine = [addr.code, addr.city].filter(Boolean).join(' ').trim();
    return [addr.address, cityLine || null].filter(Boolean).join('\n');
  }

  private buildReceiptContent(
    order: Order,
    lang: MailLanguage,
    storeName: string,
  ): { subject: string; text: string; html: string } {
    const shortId =
      order.id.length > 8 ? order.id.slice(-8) : order.id;
    const currency =
      this.configService.get<string>('CURRENCY')?.trim() || 'PLN';
    const userName = order.User?.name?.trim() || (lang === 'en' ? 'Customer' : 'Kliencie');
    const paidAt = (order.paidAt ?? new Date()).toISOString();
    const items = (order.OrderItems ?? []).map((item) => ({
      title: item.title,
      quantity: item.quantity,
      price: Number(item.price),
    }));
    const itemsBlock = this.formatItems(items, currency);
    const address = this.formatAddress(order.shippingAddress ?? {});
    const itemsTotal = this.money(Number(order.itemsPrice));
    const shippingTotal = this.money(Number(order.shippingPrice));
    const orderTotal =
      this.money(Number(order.totalPrice)) ?? String(order.totalPrice);

    const subject = this.t('messages.purchaseReceiptSubject', lang, {
      shortId,
    });

    const totals: string[] = [];
    if (itemsTotal) {
      totals.push(
        this.t('messages.purchaseReceiptItemsTotal', lang, {
          amount: itemsTotal,
          currency,
        }),
      );
    }
    if (shippingTotal) {
      totals.push(
        this.t('messages.purchaseReceiptShipping', lang, {
          amount: shippingTotal,
          currency,
        }),
      );
    }
    totals.push(
      this.t('messages.purchaseReceiptPaid', lang, {
        amount: orderTotal,
        currency,
      }),
    );

    const text = [
      this.t('messages.purchaseReceiptHello', lang, { name: userName }),
      '',
      this.t('messages.purchaseReceiptThanks', lang, { store: storeName }),
      '',
      this.t('messages.purchaseReceiptOrderId', lang, { orderId: order.id }),
      this.t('messages.purchaseReceiptDate', lang, { date: paidAt }),
      '',
      this.t('messages.purchaseReceiptItems', lang),
      itemsBlock,
      '',
      ...totals,
      '',
      this.t('messages.purchaseReceiptShippingAddress', lang),
      address,
      '',
      this.t('messages.purchaseReceiptFooter', lang),
    ].join('\n');

    const itemsHtml = items
      .map(
        (item) =>
          `<li>${item.title} x${item.quantity} @ ${Number(item.price).toFixed(2)} ${currency}</li>`,
      )
      .join('');

    const html = `<head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${this.t('messages.purchaseReceiptTitle', lang)}</title>
                <style>
                  h2 { color: gray; }
                  section { padding: 5px; }
                  p, li, pre { color: grey; }
                  pre { font-family: inherit; white-space: pre-wrap; }
                </style>
            </head>
            <body>
              <section>
                <h2>${this.t('messages.purchaseReceiptTitle', lang)}</h2>
                <p>${this.t('messages.purchaseReceiptHello', lang, { name: userName })}</p>
                <p>${this.t('messages.purchaseReceiptThanks', lang, { store: storeName })}</p>
                <p>${this.t('messages.purchaseReceiptOrderId', lang, { orderId: order.id })}</p>
                <p>${this.t('messages.purchaseReceiptDate', lang, { date: paidAt })}</p>
                <p>${this.t('messages.purchaseReceiptItems', lang)}</p>
                <ul>${itemsHtml}</ul>
                ${totals.map((line) => `<p>${line}</p>`).join('')}
                <p>${this.t('messages.purchaseReceiptShippingAddress', lang)}</p>
                <pre>${address}</pre>
                <p>${this.t('messages.purchaseReceiptFooter', lang)}</p>
              </section>
            </body>`;

    return { subject, text, html };
  }
}

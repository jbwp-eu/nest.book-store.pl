import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { Order } from '../../orders/order.entity';

@Injectable()
export class MailService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async sendPurchaseReceipt(orderId: string): Promise<{ message: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { User: true },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    const date = new Date().toLocaleString();
    const domain = this.configService.get<string>('DOMAIN');
    const toAdmin = this.configService.get<string>('TO_3');
    const shippingPrice = Number(order.shippingPrice);

    await this.createTransporter().sendMail({
      from: `"BookStore" <nest@${domain}>`,
      to: `<${order.User.email}>,<${toAdmin}>`,
      subject: this.i18n.t('messages.purchaseReceiptSubject'),
      html: this.buildReceiptHtml(
        order.id,
        date,
        order.itemsPrice,
        shippingPrice,
        order.totalPrice,
      ),
    });

    return {
      message: this.i18n.t('messages.paymentSuccessful'),
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

  private buildReceiptHtml(
    orderId: string,
    date: string,
    itemsPrice: number,
    shippingPrice: number,
    totalPrice: number,
  ): string {
    const orderIdLabel = this.i18n.t('messages.purchaseReceiptOrderId');
    const dateLabel = this.i18n.t('messages.purchaseReceiptDate');
    const itemsLabel = this.i18n.t('messages.purchaseReceiptItems');
    const shippingLabel = this.i18n.t('messages.purchaseReceiptShipping');
    const paidLabel = this.i18n.t('messages.purchaseReceiptPaid');
    const title = this.i18n.t('messages.purchaseReceiptTitle');

    return `<head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Purchase Receipt</title>
                <style>
                  h2 {
                    color: gray;
                  }
                  section {
                    padding: 5px;
                  }
                  table {
                    width: 90%;
                    }
                  th {
                    font-weight: 400;
                    text-align: left;
                    color: grey;
                  }
                  td {
                    font-weight: 300;
                    color: grey;
                    text-align: right;
                  }
                  tr {
                    justify-content: space-between;
                  }
                  #totalPrice {
                    font-weight: 700;
                  }
                </style>
            </head>
            <body>
              <section>
                <h2>${title}</h2>
                <table>
                  <tr>
                    <th>${orderIdLabel}</th>
                    <td>...${orderId.substring(orderId.length - 6)};</td>
                  </tr>
                  <tr>
                    <th>${dateLabel}</th>
                    <td>${date};</td>
                  </tr>
                  <tr>
                    <th>${itemsLabel}</th>
                    <td>${itemsPrice}; PLN</td>
                  </tr>
                  <tr>
                    <th>${shippingLabel}</th>
                    <td>${shippingPrice.toFixed(2)}; PLN</td>
                  </tr>
                  <tr>
                    <th>${paidLabel}</th>
                    <td id="totalPrice">${totalPrice}; PLN</td>
                  </tr>
                </table>
              </section>
            </body>`;
  }
}

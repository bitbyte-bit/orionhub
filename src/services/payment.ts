import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Currency configuration
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];

export const DEFAULT_CURRENCY = 'USD';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

export interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethodParams {
  customerId: string;
  paymentMethodId: string;
}

export class PaymentService {
  // Create a Stripe customer
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    });
  }

  // Get customer by ID
  async getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return await stripe.customers.retrieve(customerId) as Stripe.Customer | Stripe.DeletedCustomer;
  }

  // Update customer
  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, {
      email: params.email,
      name: params.name,
      phone: params.phone,
      metadata: params.metadata,
    });
  }

  // Create payment intent
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    const { amount, currency = DEFAULT_CURRENCY, customerId, metadata, description } = params;

    // Validate amount (convert to cents for Stripe)
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      throw new Error('Minimum amount is $0.50');
    }

    return await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        ...metadata,
        platform: 'zionn',
      },
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  // Cancel payment intent
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  }

  // Get payment intent
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  // Create refund
  async createRefund(paymentIntentId: string, amount?: number, reason?: Stripe.RefundCreateParams.Reason): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    if (reason) {
      refundParams.reason = reason;
    }

    return await stripe.refunds.create(refundParams);
  }

  // List customer's payment methods
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  }

  // Attach payment method to customer
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    return await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  // Detach payment method
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return await stripe.paymentMethods.detach(paymentMethodId);
  }

  // Set default payment method
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        ...metadata,
        platform: 'zionn',
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    }
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  // Get subscription
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(subscriptionId);
  }

  // Create price (for subscriptions)
  async createPrice(
    amount: number,
    currency: string,
    interval: 'day' | 'week' | 'month' | 'year',
    productName: string
  ): Promise<Stripe.Price> {
    // First create a product
    const product = await stripe.products.create({
      name: productName,
    });

    // Then create a price for the product
    return await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      recurring: { interval },
      product: product.id,
    });
  }

  // Webhook signature verification
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  // Calculate platform fee (commission)
  calculatePlatformFee(amount: number, rate: number = 10): number {
    return Math.round(amount * (rate / 100) * 100) / 100;
  }

  // Get exchange rate (basic implementation - in production use a real API)
  async getExchangeRate(from: string, to: string): Promise<number> {
    // Basic implementation - would integrate with currency API in production
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CAD: 1.36,
      AUD: 1.53,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.12,
      BRL: 4.97,
    };

    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    return toRate / fromRate;
  }

  // Convert amount between currencies
  async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    const rate = await this.getExchangeRate(from, to);
    return Math.round(amount * rate * 100) / 100;
  }
}

export const paymentService = new PaymentService();

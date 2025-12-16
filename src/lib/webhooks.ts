import { prisma } from './prisma';
import crypto from 'crypto';

export type WebhookEvent =
  | 'points_awarded'
  | 'redemption_completed'
  | 'customer_created'
  | 'transaction_created';

interface WebhookPayload {
  event: WebhookEvent;
  data: any;
  businessId: number;
  timestamp: string;
}

/**
 * Enqueue webhook for delivery
 */
export async function enqueueWebhook(
  businessId: number,
  event: WebhookEvent,
  data: any
): Promise<void> {
  try {
    // Find all active webhooks for this business that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        businessId,
        isActive: true,
      },
    });

    for (const webhook of webhooks) {
      const events = JSON.parse(webhook.events) as string[];
      if (events.includes(event) || events.includes('*')) {
        // Create webhook delivery record
        const payload: WebhookPayload = {
          event,
          data,
          businessId,
          timestamp: new Date().toISOString(),
        };

        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            status: 'pending',
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to enqueue webhook:', error);
  }
}

/**
 * Process pending webhook deliveries
 */
export async function processWebhookDeliveries(): Promise<void> {
  try {
    // Get pending deliveries (limit to avoid overwhelming the system)
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        status: 'pending',
        attempts: {
          lt: 5, // Max 5 attempts
        },
      },
      include: {
        webhook: true,
      },
      take: 50,
    });

    for (const delivery of deliveries) {
      await deliverWebhook(delivery);
    }
  } catch (error) {
    console.error('Failed to process webhook deliveries:', error);
  }
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(delivery: any): Promise<void> {
  try {
    const payload = JSON.parse(delivery.payload);
    const signature = generateWebhookSignature(delivery.payload, delivery.webhook.secret);

    const response = await fetch(delivery.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event,
      },
      body: delivery.payload,
    });

    if (response.ok) {
      // Success
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'success',
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });
    } else {
      // Failed
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: delivery.attempts + 1 >= 5 ? 'failed' : 'pending',
          attempts: delivery.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });
    }
  } catch (error) {
    // Error during delivery
    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: delivery.attempts + 1 >= 5 ? 'failed' : 'pending',
        attempts: delivery.attempts + 1,
        lastAttemptAt: new Date(),
      },
    });
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}


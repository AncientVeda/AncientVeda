const crypto = require('crypto');

const payload = JSON.stringify({
  id: "evt_test123",
  object: "event",
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_test123",
      amount_received: 2000,
      currency: "usd",
      status: "succeeded",
      created: 1633091234
    }
  }
});

const secret = "your_stripe_webhook_secret"; // Ersetze durch deinen Stripe-Webhook-Secret
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');

console.log(`Stripe-Signature: t=${Date.now()},v1=${signature}`);


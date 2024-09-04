import * as functions from "firebase-functions";
import Stripe from "stripe";
import * as dotenv from "dotenv";
import * as logger from "firebase-functions/logger";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
const stripeWebhookSecret = process.env.SECRET_STRIPE_WEBHOOK_KEY as string;

logger.log("secret,", stripeSecretKey);

// Initialize the Stripe instance with your secret key
const stripe = new Stripe(stripeSecretKey as string, {
    apiVersion: "2024-06-20",
});

// Export the webhook as a Firebase Cloud Function
export const stripeWebhook = functions.https.onRequest((request, response) => {
    const sig = request.headers["stripe-signature"];
    logger.log("webhook eky:", stripeWebhookSecret);

    const endpointSecret = stripeWebhookSecret; // Get the secret from Firebase config

    let event;
    let paymentIntent;
    const payloadData = request.rawBody;
    const payloadString = payloadData.toString();
    try {
        // Verify the Stripe signature and construct the event
        event = stripe.webhooks.constructEvent(payloadString, sig as string, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${(err as Error).message}`);
        response.status(400).send(`Webhook Error: ${(err as Error).message}`);
        return;
    }

    // Process the event based on its type
    switch (event.type) {
    case "payment_intent.succeeded":
        paymentIntent = event.data.object;
        console.log("PaymentIntent was successful!", paymentIntent);
        // Perform further actions, such as updating your database or notifying the user
        break;

        // Add other event types if necessary
    default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Respond to Stripe to acknowledge receipt of the event
    response.status(200).send();
});

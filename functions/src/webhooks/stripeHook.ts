import * as functions from "firebase-functions";
import Stripe from "stripe";
import * as dotenv from "dotenv";
import * as logger from "firebase-functions/logger";
import { firebaseAdmin } from "../firebase/firebaseInit";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
const stripeWebhookSecret = process.env.SECRET_STRIPE_WEBHOOK_KEY as string;

logger.log("secret,", stripeSecretKey);

const firestore = firebaseAdmin.firestore();

// Initialize the Stripe instance with your secret key
const stripe = new Stripe(stripeSecretKey as string, {
    apiVersion: "2024-06-20",
});

// Export the webhook as a Firebase Cloud Function
export const stripeWebhook = functions.https.onRequest(async (request, response) => {
    const sig = request.headers["stripe-signature"];
    logger.log("webhook eky:", stripeWebhookSecret);

    const endpointSecret = stripeWebhookSecret; // Get the secret from Firebase config

    let event;

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
    case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session);
        // Update the user in your database to reflect the successful payment
        // Perform any post-payment logic, like granting access to a product
        break;
    }
    case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        const usersRef = firestore.collection("users");
        const snapshot = await usersRef.where("stripeCustomerId", "==", stripeCustomerId).get();

        if (!snapshot.empty) {
            snapshot.forEach(async (doc) => {
                const userId = doc.id;
                console.log(`Found user with uid: ${userId}, updating subscription status to subscribed...`);

                // Update the user document to set isSubscribed: true
                await usersRef.doc(userId).update({
                    isSubscribed: true,
                });

                console.log(`User ${userId} is now marked as subscribed.`);
            });
        } else {
            console.log(`No user found with stripeCustomerId: ${stripeCustomerId}`);
        }

        break;
    }
    // Add other event types if necessary
    default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Respond to Stripe to acknowledge receipt of the event
    response.status(200).send();
});

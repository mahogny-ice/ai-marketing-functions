import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { ServiceAccount } from "firebase-admin";

dotenv.config();

if (!process.env.MY_SERVICE_ACCOUNT) {
    throw new Error("The FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
}
const serviceAccountJson = process.env.MY_SERVICE_ACCOUNT;
const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);

export const firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

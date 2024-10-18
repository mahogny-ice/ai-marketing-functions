import { onRequest } from "firebase-functions/v2/https";
import { firebaseAdmin } from "../firebase/firebaseInit";

export const getUserCredits = onRequest(async (request, response) => {
    try {
        const { userId } = request.body as { userId: string };

        if (!userId) {
            response.status(400).send({ error: "User ID is required" });
            return;
        }

        const db = firebaseAdmin.firestore();
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            response.status(404).send({ error: "User not found" });
            return;
        }

        const userData = userDoc.data();
        const credits = userData?.subscription?.credits || 0;

        response.status(200).send({ credits });
    } catch (error) {
        console.error("Error getting user credits:", error);
        response.status(500).send({ error: "Internal server error" });
    }
});

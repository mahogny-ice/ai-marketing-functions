import { onRequest } from "firebase-functions/v2/https";
import { firebaseAdmin } from "../firebase/firebaseInit";

type JobStatus = "running" | "completed" | "failed";

export const setJobStatus = onRequest(async (request, response) => {
    try {
        const { userId, jobid, status } = request.body as { userId: string, jobid: string; status: JobStatus };

        const db = firebaseAdmin.firestore();
        const jobRef = db.collection("users").doc(userId).collection("generationJobs").doc(jobid);

        await jobRef.update({ status });

        response.status(200).send({ message: `Job ${jobid} status updated to ${status}` });
    } catch (error) {
        console.error(error);
        response.status(500).send("Error updating status of job!");
    }
});

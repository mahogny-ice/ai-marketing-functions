import { onRequest } from "firebase-functions/v2/https";
import { firebaseAdmin } from "../firebase/firebaseInit";
import type { GenerationJob } from "./generatePodcastAd";

export const updateJobComponents = onRequest(async (request, response) => {
    const { jobId, musicUrl, voUrl, userId } = request.body;
    let jobRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
    let job: GenerationJob;
    if (!jobId || !userId) {
        response.status(400).send("Missing jobId or userId");
        return;
    }

    try {
        jobRef = firebaseAdmin.firestore().collection("users").doc(userId).collection("generationJobs").doc(jobId);
        job = (await jobRef.get()).data() as GenerationJob;
        if (job.status !== "running") {
            response.status(400).send("Job is not running");
            return;
        }
    } catch (error) {
        response.status(500).send("Error getting job from firestore" + error);
        return;
    }

    const components = job.components;

    if (musicUrl) components.musicUrl = musicUrl;
    if (voUrl) components.voUrl = voUrl;

    await jobRef.update({ components });
    response.status(200).send("Success");
});

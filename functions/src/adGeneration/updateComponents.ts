import { onRequest } from "firebase-functions/v2/https";
import { firebaseAdmin } from "../firebase/firebaseInit";
import type { GenerationJob } from "./generatePodcastAd";
import { logger } from "firebase-functions/v1";

export const updateJobComponents = onRequest(async (request, response) => {
    const { jobId, musicUrl, voUrl, userId, musicPrompt, voPrompt } = request.body;
    let jobRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
    let job: GenerationJob;
    if (!jobId || !userId) {
        response.status(400).send("Missing jobId or userId");
        return;
    }

    // Validate musicPrompt
    if (musicPrompt) {
        if (!musicPrompt.genres) console.warn("Missing genres");
        if (!musicPrompt.moods) console.warn("Missing moods");
        if (!musicPrompt.themes) console.warn("Missing themes");
        if (!musicPrompt.length) console.warn("Missing length");

        if (typeof (musicPrompt.genres) !== "string") console.warn("Invalid genres");
        if (typeof (musicPrompt.moods) !== "string") console.warn("Invalid moods");
        if (typeof (musicPrompt.themes) !== "string") console.warn("Invalid themes");
        if (typeof (musicPrompt.length) !== "number") console.warn("Invalid length");
    }

    // Validate voPrompt
    if (voPrompt) {
        if (!voPrompt.voice) console.warn("Missing voice");
        if (!voPrompt.input) console.warn("Missing input");
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

    try {
        const components = job.components;
        const input = job.input;

        if (musicUrl) components.musicUrl = musicUrl;
        if (voUrl) components.voUrl = voUrl;
        if (musicPrompt) input.music.prompt = musicPrompt;
        if (voPrompt) input.vo.prompt = voPrompt;

        await jobRef.update({ components, input });
        response.status(200).send("Success");
    } catch (error) {
        logger.error("Error updating job components and input! ", error);
        response.status(500).send("Error updating job components" + error);
    }
});

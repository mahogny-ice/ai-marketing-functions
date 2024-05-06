import { onRequest } from "firebase-functions/v2/https";
import { firebaseAdmin } from "../firebase/firebaseInit";
import type { GenerationJob } from "./generatePodcastAd";

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
        if (!musicPrompt.genres || !musicPrompt.moods || !musicPrompt.themes || !musicPrompt.length) {
            console.error("Invalid musicPrompt");
            return;
        }

        if (typeof (musicPrompt.genres) !== "string" || typeof (musicPrompt.moods) !== "string" || typeof (musicPrompt.themes) !== "string" || typeof (musicPrompt.length) !== "number") {
            console.error("Invalid musicPrompt");
            return;
        }
    }

    // Validate voPrompt
    if (voPrompt) {
        if (!voPrompt.voice || !voPrompt.input) {
            console.error("Invalid voPrompt");
            return;
        }

        if (typeof (voPrompt.voice) !== "string" || typeof (voPrompt.input) !== "string") {
            console.error("Invalid voPrompt");
            return;
        }
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
    const input = job.input;

    if (musicUrl) components.musicUrl = musicUrl;
    if (voUrl) components.voUrl = voUrl;
    if (musicPrompt) input.music.prompt = musicPrompt;
    if (voPrompt) input.vo.prompt = voPrompt;

    await jobRef.update({ components });
    response.status(200).send("Success");
});

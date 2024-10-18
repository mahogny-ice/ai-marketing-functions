import { processNewUser } from "./auth/processNewUser";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";
import { updateJobComponents } from "./adGeneration/updateComponents";
import { generateSpeech } from "./apiCalls/generateSpeech";
import { wakeUpMerger } from "./adGeneration/wakeUpMerger";
import { setJobStatus } from "./adGeneration/setJobStatus";
import { stripeWebhook } from "./webhooks/stripeHook";
import { getUserCredits } from "./utils/getUserCredits";

export {
    processNewUser,
    generatePodcastAd,
    initiateMerge,
    updateJobComponents,
    generateSpeech,
    wakeUpMerger,
    setJobStatus,
    stripeWebhook,
    getUserCredits,
};

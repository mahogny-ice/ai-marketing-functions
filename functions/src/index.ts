import { processNewUser } from "./auth/processNewUser";
import { generatePodcastAd } from "./adGeneration/generatePodcastAd";
import { initiateMerge } from "./adGeneration/firestoreTriggers/initiateMerge";
import { updateJobComponents } from "./adGeneration/updateComponents";
import { generateSpeech } from "./apiCalls/generateSpeech";
import { wakeUpMerger } from "./adGeneration/wakeUpMerger";

export {
    processNewUser,
    generatePodcastAd,
    initiateMerge,
    updateJobComponents,
    generateSpeech,
    wakeUpMerger,
};

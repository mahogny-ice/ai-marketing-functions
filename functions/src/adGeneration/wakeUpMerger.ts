import { onRequest } from "firebase-functions/v2/https";

export const wakeUpMerger = onRequest(async (request, response) => {
    const res = await fetch("https://merge-media-dx3v2rbg6q-od.a.run.app/wakeup");

    if (res.ok) {
        response.status(200).send("Success! " + await res.text());
    } else {
        response.status(500).send("Error waking up merger! " + await res.text());
    }
});

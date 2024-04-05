import { UserRecord } from "firebase-admin/auth";
import functions = require('firebase-functions');
import admin = require('firebase-admin');

admin.initializeApp();

export const processNewUser = functions.auth.user().onCreate((user: UserRecord) => {
    const email = user.email;
    const displayName = user.displayName;
    const uid = user.uid;

    const userDocRef = admin.firestore().collection('users').doc(uid);

    userDocRef.set({
        email,
        displayName,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    userDocRef.collection('podcastAds');

    console.log('New user created:', email, displayName, uid);
});
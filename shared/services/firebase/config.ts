import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore: Firebase v11+ types might mismatch for RN persistence, but it works at runtime
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (Singleton pattern)
let app: any;
let auth: any;

if (getApps().length === 0) {
    try {
        app = initializeApp(firebaseConfig);
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch (e) {
        console.error("Firebase Init Failed (Non-Fatal):", e);
        // Fallback or retry logic could go here. 
        // For now, we allow the app to boot without auth to avoid crash loops.
    }
} else {
    app = getApp();
    try {
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase GetAuth Failed:", e);
    }
}

export { auth };
export const firestore = getFirestore(app);
export default app;

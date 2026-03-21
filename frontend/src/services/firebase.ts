import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// 🛡️ Firebase configuration from google-services.json
// Note: You must register a "Web" app in your Firebase Console to get the correct Web Config.
// The values below are translated from your Android google-services.json.

const firebaseConfig = {
    apiKey: "AIzaSyBfdFuj1UUSjkGkGIIalqyRR2Xx9nl_t2E",
    authDomain: "blooddonation-a3c70.firebaseapp.com",
    projectId: "blooddonation-a3c70",
    storageBucket: "blooddonation-a3c70.firebasestorage.app",
    messagingSenderId: "184103913153",
    appId: "1:184103913153:web:0dcd6f48672b1d76c23640", // Placeholder: Please replace with your actual Firebase Web App ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export default app;

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let auth: any = null;
let isFirebaseEnabled = false;

if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    isFirebaseEnabled = true;
    console.log('Firebase Authentication service initialized successfully.');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.log('No Firebase credentials found. Running in Local Auth Bypass Mode.');
}

export { auth, isFirebaseEnabled };

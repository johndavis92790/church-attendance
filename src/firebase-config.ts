import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// This should match what's in your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyA21fvueWlw0Z-ea5Ajn70iunFvZlmE_CA",
  authDomain: "church-attendance-46a04.firebaseapp.com",
  projectId: "church-attendance-46a04",
  storageBucket: "church-attendance-46a04.firebasestorage.app",
  messagingSenderId: "736560032232",
  appId: "1:736560032232:web:173c4599b2bfb47d201c5d",
  measurementId: "G-2X120JYJHR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;

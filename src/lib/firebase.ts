import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Parse the firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
  storageBucket: "gen-lang-client-0865665135.firebasestorage.app",
  messagingSenderId: "713208023788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Use the specific databaseId if provided
// In the web SDK for multiple databases, it's getFirestore(app, databaseId)

export const firestoreDb = getFirestore(app, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

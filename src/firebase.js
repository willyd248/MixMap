import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBzfAcB6vCD2Od7qANHYBiMaVdrrw-1DyM",
  authDomain: "mixmap-843af.firebaseapp.com",
  projectId: "mixmap-843af",
  storageBucket: "mixmap-843af.firebasestorage.app",
  messagingSenderId: "451377119162",
  appId: "1:451377119162:web:9442b354b6ce41d8b86783",
  measurementId: "G-JEB08S31L9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut, db, analytics }; 
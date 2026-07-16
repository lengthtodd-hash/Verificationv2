import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

async function run() {
  const querySnapshot = await getDocs(collection(firestoreDb, 'documents'));
  console.log("Docs found:", querySnapshot.size);
  process.exit(0);
}
run().catch(console.error);

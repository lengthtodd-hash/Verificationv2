import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

async function run() {
  const newDocId = `doc_${Date.now()}`;
  await setDoc(doc(db, "documents", newDocId), {
    id: newDocId,
    fullName: "Test User",
    phoneNumber: "1234567890",
    streetAddress: "123 Main St",
    zipCode: "12345",
    title: "Test Title",
    status: "pending",
    submittedAt: new Date().toISOString()
  });
  console.log("Added doc", newDocId);
  process.exit(0);
}
run().catch(console.error);

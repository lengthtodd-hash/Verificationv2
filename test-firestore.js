import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

async function run() {
  const codeRef = doc(firestoreDb, 'accessCodes', '123456');
  await setDoc(codeRef, { code: '123456', used: false, createdAt: new Date().toISOString() });
  console.log("Set code 123456");

  const snap = await getDoc(codeRef);
  console.log("Exists:", snap.exists(), "Data:", snap.data());
  process.exit(0);
}
run().catch(console.error);

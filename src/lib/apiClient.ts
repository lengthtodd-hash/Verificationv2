import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  employeeLogin: async (accessCode: string) => {
    await delay(500);
    
    // Check if access code exists in Firestore
    const codeRef = doc(firestoreDb, 'accessCodes', accessCode);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      // If no codes exist at all, we might want to fallback to the default '108026'
      // But let's check if '108026' was entered and not used.
      if (accessCode === '108026') {
        const defaultRef = doc(firestoreDb, 'accessCodes', '108026');
        await setDoc(defaultRef, { code: '108026', used: false, createdAt: new Date().toISOString() });
      } else {
        throw new Error('Invalid access code');
      }
    }
    
    // We get it again just in case we created the default one
    const finalCodeSnap = await getDoc(codeRef);
    if (!finalCodeSnap.exists() || finalCodeSnap.data().used) {
      throw new Error('Invalid or already used access code');
    }
    
    // Mark as used or delete it
    await deleteDoc(codeRef);
    
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
    const newDocId = `doc_${Date.now()}`;
    const newDoc = {
      id: newDocId,
      userId: user.id,
      username: user.username,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ipAddress: 'Client-Side (Local)',
      ...docData,
      // We can keep fileUrl now because Firestore can hold strings up to 1MB. Base64 images are usually small enough, but let's be careful.
      // If it's a huge PDF it might exceed 1MB, but it's better than localStorage's 5MB limit which was shared.
    };
    
    const docRef = doc(firestoreDb, 'documents', newDocId);
    await setDoc(docRef, newDoc);

    // Send notification and file to Discord via our Cloudflare function proxy to avoid CORS
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
      
      fetch('/api/discord', {
        method: 'POST',
        body: form
      }).then(res => {
        if (!res.ok) console.error("Discord webhook proxy responded with status:", res.status);
      }).catch(err => console.error("Discord webhook proxy fetch error:", err));
    } catch (e) {
      console.error("Error formatting Discord webhook payload", e);
    }

    return { success: true, docId: newDocId };
  },
  
  getAdminDocuments: async () => {
    const querySnapshot = await getDocs(collection(firestoreDb, 'documents'));
    const docs: any[] = [];
    querySnapshot.forEach((doc) => {
      docs.push(doc.data());
    });
    // Sort by submittedAt descending
    docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return docs;
  },
  
  updateDocumentStatus: async (id: string, status: string) => {
    const docRef = doc(firestoreDb, 'documents', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('Document not found');
    }
    await updateDoc(docRef, { status });
    return { success: true, doc: { ...docSnap.data(), status } };
  },
  
  getAccessCodes: async () => {
    const querySnapshot = await getDocs(collection(firestoreDb, 'accessCodes'));
    let codes: string[] = [];
    querySnapshot.forEach((doc) => {
      codes.push(doc.id);
    });
    
    // Seed initial code if none exists
    if (codes.length === 0) {
      const defaultRef = doc(firestoreDb, 'accessCodes', '108026');
      await setDoc(defaultRef, { code: '108026', used: false, createdAt: new Date().toISOString() });
      codes.push('108026');
    }
    
    return { codes };
  },
  
  generateAccessCode: async () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeRef = doc(firestoreDb, 'accessCodes', newCode);
    await setDoc(codeRef, { code: newCode, used: false, createdAt: new Date().toISOString() });
    
    return { code: newCode };
  }
};

import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  employeeLogin: async (accessCode: string) => {
    await delay(500);
    
    // Check if access code exists in Firestore
    const codeRef = doc(firestoreDb, 'accessCodes', accessCode);
    let codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      // Fallback for default demo code
      if (accessCode === '108026') {
        const defaultRef = doc(firestoreDb, 'accessCodes', '108026');
        await setDoc(defaultRef, { code: '108026', used: false, createdAt: new Date().toISOString() });
        codeSnap = await getDoc(codeRef);
      } else {
        throw new Error('Invalid access code');
      }
    }
    
    if (!codeSnap.exists() || codeSnap.data()?.used) {
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

    // Send notification and file to Discord via our server proxy to avoid CORS and parse properly
    try {
      const message = `**New Document Submitted**\n**User:** ${user.username}\n**Name:** ${docData.fullName || 'N/A'}\n**Phone:** ${docData.phoneNumber || 'N/A'}\n**Address:** ${docData.streetAddress || 'N/A'}, ${docData.zipCode || 'N/A'}`;
      
      let fileName = 'document.bin';
      if (docData.fileUrl) {
        const match = docData.fileUrl.match(/^data:([A-Za-z-+\/]+);base64,/);
        if (match) {
          const mimeType = match[1];
          let extension = 'bin';
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
          else if (mimeType.includes('pdf')) extension = 'pdf';
          fileName = `document.${extension}`;
        }
      }

      fetch('/api/discord', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          fileUrl: docData.fileUrl,
          fileName
        })
      }).then(res => {
        if (!res.ok) console.error("Discord webhook proxy responded with status:", res.status);
      }).catch(err => console.error("Discord webhook proxy fetch error:", err));
    } catch (e) {
      console.error("Error sending to Discord webhook proxy", e);
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

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

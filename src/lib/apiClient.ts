export const api = {
  employeeLogin: async (accessCode: string) => {
    const res = await fetch('/api/employee/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  
  adminLogin: async (username: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  
  submitDocument: async (docData: any, user: any) => {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docData, user })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Submit failed');
    return data;
  },
  
  getAdminDocuments: async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fetch failed');
    return data;
  },
  
  getAccessCodes: async () => {
    const res = await fetch('/api/codes');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fetch failed');
    return data;
  },
  
  generateAccessCode: async () => {
    const res = await fetch('/api/codes', {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generate failed');
    return data;
  }
};

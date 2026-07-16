import { io, Socket } from 'socket.io-client';

// Use same host/port
const socket: Socket = io('/', { autoConnect: true });

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
  
  subscribeAdminDocuments: (callback: (docs: any[]) => void) => {
    // initial fetch
    fetch('/api/documents').then(res => res.json()).then(data => callback(data)).catch(console.error);
    
    // listen for live updates from server
    const handler = (docs: any[]) => callback(docs);
    socket.on('documents_updated', handler);
    return () => {
      socket.off('documents_updated', handler);
    };
  },
  
  subscribeAccessCodes: (callback: (codes: string[]) => void) => {
    // initial fetch
    fetch('/api/codes').then(res => res.json()).then(data => callback(data.codes)).catch(console.error);
    
    // listen for live updates from server
    const handler = (codes: string[]) => callback(codes);
    socket.on('codes_updated', handler);
    return () => {
      socket.off('codes_updated', handler);
    };
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

export const updateDocumentStatus = async (id: string, status: string) => {
  const res = await fetch(`/api/documents/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
};

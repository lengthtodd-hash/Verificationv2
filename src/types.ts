export interface User {
  id: string;
  username: string;
  role: 'employee' | 'admin';
}

export interface Document {
  id: string;
  userId: string;
  username: string;
  title: string;
  fullName?: string;
  phoneNumber?: string;
  streetAddress?: string;
  zipCode?: string;
  fileUrl?: string; // only populated for details
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

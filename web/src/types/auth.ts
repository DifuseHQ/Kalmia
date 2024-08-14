export interface ValidatedJWT {
  token: string;
  email: string;
  username: string;
  photo: string;
  expiry: string;
  admin: boolean;
  userId: string;
  status: 'success' | 'error' | 'warning';
}

export interface User {
  id: number;
  admin: boolean;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}
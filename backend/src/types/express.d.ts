declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: string;
      createdAt: Date;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export interface DatabaseError extends Error {
  code?: string;
  meta?: any;
}

export {};
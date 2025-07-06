import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).role === 'ADMIN') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // This middleware allows both authenticated and non-authenticated users
  next();
};
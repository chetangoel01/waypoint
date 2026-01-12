import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '../config/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  supabase?: any; // Authenticated Supabase client
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Missing authorization header',
    });
  }

  const token = authHeader.replace('Bearer ', '');

  // Create a new client for this user using their access token
  // This ensures RLS policies are applied automatically
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify the token by fetching the user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  // Attach user and scoped client to request
  req.user = {
    id: user.id,
    email: user.email,
  };
  req.supabase = supabase;

  next();
};

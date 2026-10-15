import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "../config/index.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: "owner" | "admin" | "analyst" | "viewer";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
      requestId?: string;
    }
  }
}

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000099";
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqOrgId = (req.headers["x-organization-id"] as string) || DEFAULT_ORG_ID;

  // Check Authorization header for Bearer token
  const authHeader = req.headers.authorization;
  if (isSupabaseConfigured && authHeader && authHeader.startsWith("Bearer ") && config.SUPABASE_URL) {
    const token = authHeader.substring(7);
    try {
      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY || config.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email || "user@visioniq.internal",
          organizationId: reqOrgId,
          role: "owner",
        };
        req.organizationId = reqOrgId;
        return next();
      }
    } catch (e) {
      console.warn("[Auth] Token verification failed, falling back to local session:", e);
    }
  }

  // Local / Demo Development session
  req.user = {
    id: DEFAULT_USER_ID,
    email: "lead.inspector@visioniq.internal",
    organizationId: reqOrgId,
    role: "owner",
  };
  req.organizationId = reqOrgId;
  next();
}

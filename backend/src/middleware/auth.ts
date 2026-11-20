import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import { config } from "../config.js";

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

export type AuthLocals = Record<string, unknown> & {
  auth: AuthContext;
};

export type AuthenticatedHandler = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  ParsedQs,
  AuthLocals
>;

export const requireAuth: AuthenticatedHandler = async (_req, res, next) => {
  const authorization = _req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: "ログインが必要です。" });
    return;
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "ログイン状態を確認できません。再度ログインしてください。" });
    return;
  }

  res.locals.auth = { supabase, user: data.user };
  next();
};

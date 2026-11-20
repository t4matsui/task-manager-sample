import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedHandler } from "../middleware/auth.js";

const router = Router();
const taskInput = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  is_completed: z.boolean().optional(),
}).strict();

router.use(requireAuth);

const listTasks: AuthenticatedHandler = async (_req, res) => {
  const { data, error } = await res.locals.auth.supabase
    .from("tasks")
    .select("id, title, description, is_completed, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  res.json(data);
};

const createTask: AuthenticatedHandler = async (req, res) => {
  const parsed = taskInput.safeParse(req.body);
  if (!parsed.success || !parsed.data.title) {
    res.status(400).json({ error: "タスク名（1〜200文字）を入力してください。" });
    return;
  }

  const { data, error } = await res.locals.auth.supabase
    .from("tasks")
    .insert({
      user_id: res.locals.auth.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
    })
    .select("id, title, description, is_completed, created_at, updated_at")
    .single();
  if (error) throw error;
  res.status(201).json(data);
};

const updateTask: AuthenticatedHandler = async (req, res) => {
  const parsed = taskInput.safeParse(req.body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "更新する内容を正しく指定してください。" });
    return;
  }

  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "タスクIDが正しくありません。" });
    return;
  }

  const { data, error } = await res.locals.auth.supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", id.data)
    .select("id, title, description, is_completed, created_at, updated_at")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    res.status(404).json({ error: "タスクが見つかりません。" });
    return;
  }
  res.json(data);
};

const removeTask: AuthenticatedHandler = async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "タスクIDが正しくありません。" });
    return;
  }

  const { data, error } = await res.locals.auth.supabase
    .from("tasks")
    .delete()
    .eq("id", id.data)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    res.status(404).json({ error: "タスクが見つかりません。" });
    return;
  }
  res.status(204).end();
};

router.get("/", listTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", removeTask);

export default router;

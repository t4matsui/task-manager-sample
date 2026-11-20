"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type Task,
} from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Filter = "all" | "active" | "completed";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [accessToken, setAccessToken] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshTasks = useCallback(async (token: string) => {
    setTasks(await listTasks(token));
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (!data.session) {
        router.replace("/login");
        return;
      }

      setAccessToken(data.session.access_token);
      setEmail(data.session.user.email ?? "");
      try {
        await refreshTasks(data.session.access_token);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "タスクを取得できませんでした。");
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setAccessToken(session.access_token);
      setEmail(session.user.email ?? "");
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshTasks, router]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (filter === "active") return !task.is_completed;
        if (filter === "completed") return task.is_completed;
        return true;
      }),
    [filter, tasks],
  );

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setError("");
    setBusy(true);
    try {
      const created = await createTask(accessToken, { title, description });
      setTasks((current) => [created, ...current]);
      setTitle("");
      setDescription("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "タスクを追加できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(task: Task) {
    if (!accessToken) return;
    setError("");
    try {
      const updated = await updateTask(accessToken, task.id, {
        is_completed: !task.is_completed,
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "タスクを更新できませんでした。");
    }
  }

  async function editTask(task: Task) {
    if (!accessToken) return;
    const nextTitle = window.prompt("タスク名", task.title);
    if (nextTitle === null) return;
    const trimmedTitle = nextTitle.trim();
    if (!trimmedTitle) {
      setError("タスク名を入力してください。");
      return;
    }
    const nextDescription = window.prompt("説明", task.description);
    if (nextDescription === null) return;

    setError("");
    try {
      const updated = await updateTask(accessToken, task.id, {
        title: trimmedTitle,
        description: nextDescription.trim(),
      });
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "タスクを更新できませんでした。");
    }
  }

  async function removeTask(task: Task) {
    if (!accessToken || !window.confirm(`「${task.title}」を削除しますか？`)) return;
    setError("");
    try {
      await deleteTask(accessToken, task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "タスクを削除できませんでした。");
    }
  }

  async function signOut() {
    const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.replace("/login");
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <p className="muted">社内タスク管理サンプル</p>
          <h1>マイタスク</h1>
          <p className="muted">{email}</p>
        </div>
        <button className="secondary" type="button" onClick={signOut}>
          ログアウト
        </button>
      </header>

      <section className="card">
        <h2>タスクを追加</h2>
        {error && <p className="error" role="alert">{error}</p>}
        <form className="form" onSubmit={addTask}>
          <label className="field">
            タスク名
            <input
              maxLength={200}
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例：週次レポートを作成する"
            />
          </label>
          <label className="field">
            説明（任意）
            <textarea
              maxLength={5000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="タスクの詳細"
            />
          </label>
          <button type="submit" disabled={busy || !accessToken}>
            {busy ? "追加中..." : "タスクを追加"}
          </button>
        </form>
      </section>

      <nav className="filters" aria-label="タスクの絞り込み">
        {([
          ["all", "すべて"],
          ["active", "未完了"],
          ["completed", "完了済み"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filter === value ? "" : "secondary"}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="task-list" aria-live="polite">
        {visibleTasks.length === 0 ? (
          <p className="empty">表示するタスクはありません。</p>
        ) : (
          visibleTasks.map((task) => (
            <article
              className={`task${task.is_completed ? " completed" : ""}`}
              key={task.id}
            >
              <div className="task-heading">
                <h2>{task.title}</h2>
                <time className="muted" dateTime={task.created_at}>
                  {new Date(task.created_at).toLocaleDateString("ja-JP")}
                </time>
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void toggleTask(task)}
                >
                  {task.is_completed ? "未完了に戻す" : "完了にする"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void editTask(task)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => void removeTask(task)}
                >
                  削除
                </button>
              </div>
            </article>
          ))
        )}
      </section>
      <p className="links"><Link href="/">トップへ戻る</Link></p>
    </main>
  );
}

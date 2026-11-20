"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        throw authError;
      }
      router.replace("/tasks");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ログインに失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card card">
      <h1>ログイン</h1>
      <p className="muted">登録済みのメールアドレスでログインしてください。</p>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="form" onSubmit={submit}>
        <label className="field">
          メールアドレス
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <div className="links">
        <Link href="/signup">新規登録</Link>
        <Link href="/reset-password">パスワードを忘れた場合</Link>
      </div>
    </main>
  );
}

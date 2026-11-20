"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { data, error: authError } =
        await getSupabaseBrowserClient().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/tasks` },
        });
      if (authError) {
        throw authError;
      }
      if (data.session) {
        router.replace("/tasks");
      } else {
        setMessage("確認メールを送信しました。メール内のリンクから登録を完了してください。");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登録に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card card">
      <h1>新規登録</h1>
      <p className="muted">メールアドレスとパスワードを登録してください。</p>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success" role="status">{message}</p>}
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
          パスワード（8文字以上）
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "登録中..." : "登録"}
        </button>
      </form>
      <div className="links">
        <Link href="/login">ログインに戻る</Link>
      </div>
    </main>
  );
}

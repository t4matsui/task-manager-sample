"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { error: authError } =
        await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
      if (authError) {
        throw authError;
      }
      setMessage("再設定用のメールを送信しました。メールをご確認ください。");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "メールを送信できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card card">
      <h1>パスワードリセット</h1>
      <p className="muted">登録済みのメールアドレスに再設定リンクを送信します。</p>
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
        <button type="submit" disabled={busy}>
          {busy ? "送信中..." : "再設定メールを送信"}
        </button>
      </form>
      <div className="links">
        <Link href="/login">ログインに戻る</Link>
      </div>
    </main>
  );
}

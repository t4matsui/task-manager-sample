"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data, error: sessionError } =
        await getSupabaseBrowserClient().auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (!data.session) {
        throw new Error("再設定リンクが無効か、有効期限が切れています。メールから再度アクセスしてください。");
      }

      const { error: updateError } =
        await getSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      router.replace("/tasks");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "パスワードを変更できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card card">
      <h1>新しいパスワード</h1>
      <p className="muted">新しいパスワードを入力してください。</p>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="form" onSubmit={submit}>
        <label className="field">
          新しいパスワード（8文字以上）
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
          {busy ? "変更中..." : "パスワードを変更"}
        </button>
      </form>
      <div className="links">
        <Link href="/login">ログインに戻る</Link>
      </div>
    </main>
  );
}

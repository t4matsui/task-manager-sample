"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function HomePage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }
        if (data.session) {
          window.location.replace("/tasks");
        } else if (active) {
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) {
          setChecking(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page card">
      <p className="muted">社内タスク管理サンプル</p>
      <h1>タスクを、ひとつずつ。</h1>
      <p className="muted">
        ログインして、自分のタスクを登録・整理できます。
      </p>
      {!checking && (
        <div className="links">
          <Link className="button" href="/login">
            ログイン
          </Link>
          <Link className="button secondary" href="/signup">
            新規登録
          </Link>
        </div>
      )}
    </main>
  );
}

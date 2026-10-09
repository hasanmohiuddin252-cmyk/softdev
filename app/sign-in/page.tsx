"use client";

import { signIn } from "next-auth/react";
import { GitFork, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  return (
    <main className="sign-in-page">
      <section aria-labelledby="sign-in-title" className="sign-in-card">
        <span aria-hidden="true" className="brand-mark">
          <ShieldCheck size={21} />
        </span>
        <h1 id="sign-in-title">Sentinel private preview</h1>
        <p>Sign in with an approved GitHub account to access the security workspace.</p>
        <p className="sign-in-note">
          Access is restricted to GitHub accounts on the preview allow-list.
        </p>
        <button
          className="button button-primary sign-in-button"
          onClick={() => void signIn("github", { callbackUrl: "/" })}
          type="button"
        >
          <GitFork aria-hidden="true" size={16} />
          Continue with GitHub
        </button>
      </section>
    </main>
  );
}

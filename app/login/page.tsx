"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, demoMode, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const error =
      mode === "login" ? await signIn(email, password) : await signUp(email, password);

    if (error) {
      setMessage(error);
    } else if (mode === "signup") {
      setMessage("Račun je ustvarjen. Če imaš v Supabase vključen email confirm, potrdi email.");
    } else {
      router.replace("/dashboard");
    }

    setSubmitting(false);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-ink text-paper">
            <Camera className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold text-ink">
            FotoFlow Manager
          </h1>
          <p className="mt-2 text-sm text-muted">
            Interni pregled fotografiranj, rokov in plačil.
          </p>
        </div>

        <div className="surface rounded-lg p-5">
          {demoMode ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-white/60 p-4">
                <p className="font-semibold text-ink">Demo način je aktiven</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Supabase ključi še niso nastavljeni, zato lahko aplikacijo preizkusiš z lokalnimi primeri.
                </p>
              </div>
              <Link href="/dashboard" className="button-primary w-full">
                Nadaljuj v aplikacijo
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 rounded-lg border border-line bg-white/60 p-1">
                <button
                  type="button"
                  className={
                    mode === "login"
                      ? "rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper"
                      : "rounded-md px-3 py-2 text-sm font-semibold text-muted"
                  }
                  onClick={() => setMode("login")}
                >
                  Prijava
                </button>
                <button
                  type="button"
                  className={
                    mode === "signup"
                      ? "rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper"
                      : "rounded-md px-3 py-2 text-sm font-semibold text-muted"
                  }
                  onClick={() => setMode("signup")}
                >
                  Registracija
                </button>
              </div>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    className="input pl-10"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ime@example.com"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-ink">Geslo</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    className="input pl-10"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Vsaj 6 znakov"
                  />
                </div>
              </label>

              {message ? (
                <div className="rounded-lg border border-line bg-white/60 px-3 py-2 text-sm text-muted">
                  {message}
                </div>
              ) : null}

              <button className="button-primary w-full" disabled={submitting}>
                {submitting
                  ? "Pošiljam"
                  : mode === "login"
                    ? "Prijava"
                    : "Ustvari račun"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

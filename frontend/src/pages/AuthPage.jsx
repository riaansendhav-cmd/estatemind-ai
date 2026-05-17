import React, { useState } from "react";
import { Building2, LockKeyhole, LogIn } from "lucide-react";
import { api } from "../services/api";

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = mode === "register" ? await api.register(form) : await api.login(form);
      onAuthed(session);
    } catch (err) {
      setError(err.message || "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app light auth-shell">
      <section className="auth-card panel">
        <div className="auth-brand">
          <span className="brand-icon"><Building2 size={24} /></span>
          <div>
            <h1>EstateMind AI</h1>
            <p>Sign in to keep saved homes, recommendations, and sale listings tied to your account.</p>
          </div>
        </div>

        <div className="auth-toggle">
          <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")} type="button">
            Login
          </button>
          <button className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")} type="button">
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 6 characters" required />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button" disabled={loading}>
            {mode === "login" ? <LogIn size={18} /> : <LockKeyhole size={18} />}
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

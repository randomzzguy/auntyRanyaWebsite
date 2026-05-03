import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/account");
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Sign in to your account to view orders and manage your profile." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper p-8 brutal-lg">
          <h1 className="text-3xl font-extrabold">Sign In</h1>
          <p className="mt-2 text-muted-foreground">Welcome back! Sign in to access your orders.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 focus:outline-none focus:bg-accent/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 focus:outline-none focus:bg-accent/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal brutal-hover disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

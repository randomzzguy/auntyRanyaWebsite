import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to confirm.");
      navigate("/login");
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Create an account to order books and services." />
        <link rel="canonical" href="https://aunty-ranya-website.vercel.app/signup" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-paper p-8 brutal-lg">
          <h1 className="text-3xl font-extrabold">Sign Up</h1>
          <p className="mt-2 text-muted-foreground">Create an account to save your orders and checkout faster.</p>
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
              <p className="mt-1 text-xs text-muted-foreground">Must be at least 6 characters.</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal brutal-hover disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

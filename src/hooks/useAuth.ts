import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
      await fetchRole(session?.user?.id ?? null);
      setLoading(false);
    };

    const fetchRole = async (uid: string | null) => {
      if (!uid) {
        setRole(null);
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .single();
      if (error) {
        console.error("[useAuth] user_roles error:", error);
      }
      console.log("[useAuth] user_roles data:", data);
      setRole(data?.role ?? "customer");
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      fetchRole(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = role === "admin";

  return { user, role, isAdmin, loading };
}

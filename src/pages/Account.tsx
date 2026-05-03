import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import type { Database } from "@/lib/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export default function Account() {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load orders.");
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  return (
    <>
      <Helmet>
        <title>My Account — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="View your order history and account details." />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container">
          <h1 className="text-4xl font-extrabold">My Account</h1>
          <p className="mt-2 text-muted-foreground">Manage your orders and profile.</p>

          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            <div className="rounded-3xl border-2 border-ink bg-paper p-6 brutal">
              <h2 className="text-xl font-extrabold">Profile</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-semibold">Email:</span> {user?.email}</p>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex mt-3 items-center gap-2 rounded-full bg-accent text-ink px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover"
                  >
                    Go to Admin →
                  </Link>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-3xl border-2 border-ink bg-paper p-6 brutal">
              <h2 className="text-xl font-extrabold">Order History</h2>
              {loading ? (
                <p className="mt-4 text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="mt-4 text-muted-foreground">No orders yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between rounded-2xl border-2 border-ink bg-muted/40 p-4 brutal-sm">
                      <div>
                        <strong className="block">Order #{o.id.slice(0, 8)}</strong>
                        <small className="text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()} · {o.payment_method} · {o.status}
                        </small>
                      </div>
                      <span className="font-display text-lg font-extrabold text-primary">EGP {o.total}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

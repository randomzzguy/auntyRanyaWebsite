import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Package, ArrowLeft, LogOut, ShoppingBag, ShieldCheck } from "lucide-react";
import type { Database } from "@/lib/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  paid: "bg-green-100 text-green-800 border-green-300",
  shipped: "bg-blue-100 text-blue-800 border-blue-300",
  delivered: "bg-primary/10 text-primary border-primary/30",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  refunded: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function Account() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
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

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out.");
    navigate("/");
  };

  return (
    <>
      <Helmet>
        <title>My Account — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="View your order history and account details." />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-extrabold">My Account</h1>
              <p className="mt-1 text-muted-foreground">Manage your orders and profile.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-paper px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Home
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent text-ink px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full bg-paper px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="rounded-3xl border-2 border-ink bg-paper p-6 brutal space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-ink">
                  <span className="text-lg font-extrabold text-primary">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">Profile</h2>
                  <p className="text-xs text-muted-foreground">{isAdmin ? "Administrator" : "Customer"}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Email:</span> {user?.email}</p>
                <p><span className="font-semibold">Member since:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
              </div>
              <div className="pt-2 border-t border-ink/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-extrabold text-primary">{orders.length}</span>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="lg:col-span-2 rounded-3xl border-2 border-ink bg-paper p-6 brutal">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-extrabold">Order History</h2>
              </div>

              {loading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No orders yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Start exploring our magical books!</p>
                  <Link
                    to="/"
                    className="inline-flex mt-4 items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Browse Store
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-muted/40 p-4 brutal-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="font-mono">Order #{o.id.slice(0, 8).toUpperCase()}</strong>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor[o.status] || "bg-gray-100 text-gray-700 border-gray-300"}`}>
                            {o.status}
                          </span>
                        </div>
                        <small className="text-muted-foreground block">
                          {new Date(o.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {o.payment_method === "cod"
                            ? "Cash on Delivery"
                            : o.payment_method === "vodafone"
                            ? "Vodafone Cash"
                            : o.payment_method === "bank"
                            ? "Bank Transfer"
                            : o.payment_method}
                        </small>
                      </div>
                      <span className="font-display text-lg font-extrabold text-primary whitespace-nowrap">
                        EGP {o.total}
                      </span>
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

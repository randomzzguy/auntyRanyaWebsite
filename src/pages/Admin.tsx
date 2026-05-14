import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import type { Database } from "@/lib/supabase";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ContactRow = Database["public"]["Tables"]["contact_submissions"]["Row"];

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"];

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "products" | "messages">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [productForm, setProductForm] = useState<Partial<ProductRow>>({ active: true, stock: 0, price: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out.");
    navigate("/");
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    const [ordersRes, productsRes, contactsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    ]);
    if (ordersRes.error) toast.error("Failed to load orders.");
    if (productsRes.error) toast.error("Failed to load products.");
    if (contactsRes.error) toast.error("Failed to load messages.");
    setOrders(ordersRes.data || []);
    setProducts(productsRes.data || []);
    setContacts(contactsRes.data || []);
    setLoading(false);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Order updated.");
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    }
  };

  const exportOrdersCSV = () => {
    const headers = ["id", "status", "payment_method", "total", "created_at", "shipping_json"];
    const rows = orders.map((o) => [
      o.id,
      o.status,
      o.payment_method,
      o.total,
      o.created_at,
      JSON.stringify(o.shipping_json),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setProductForm((prev) => ({ ...prev, image_url: data.publicUrl }));
    toast.success("Image uploaded.");
    setUploadingImage(false);
  };

  const saveProduct = async () => {
    const payload = {
      name: productForm.name || "",
      price: Number(productForm.price) || 0,
      description: productForm.description || "",
      badge: productForm.badge || "",
      badge_tone: productForm.badge_tone || "primary",
      image_url: productForm.image_url || "",
      stock: Number(productForm.stock) || 0,
      active: productForm.active ?? true,
    };

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      toast.success("Product updated.");
      setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select().single();
      if (error) return toast.error(error.message);
      toast.success("Product created.");
      if (data) setProducts((prev) => [data, ...prev]);
    }

    setProductForm({ active: true, stock: 0, price: 0 });
    setEditingId(null);
  };

  const editProduct = (p: ProductRow) => {
    setEditingId(p.id);
    setProductForm({ ...p });
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted.");
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const markContactRead = async (id: string, read: boolean) => {
    const { error } = await supabase.from("contact_submissions").update({ read }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, read } : c)));
    }
  };

  const unreadCount = useMemo(() => contacts.filter((c) => !c.read).length, [contacts]);

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Admin dashboard for managing orders, products, and customer messages." />
        <link rel="canonical" href="https://aunty-ranya-website.vercel.app/admin" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-extrabold">Admin Dashboard</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/"
                className="rounded-full bg-paper px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
              >
                ← Home
              </Link>
              <Link
                to="/account"
                className="rounded-full bg-paper px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
              >
                Account
              </Link>
              <button
                onClick={logout}
                className="rounded-full bg-accent text-ink px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover text-sm"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setTab("orders")}
              className={`rounded-full px-5 py-2.5 font-bold border-2 border-ink brutal-sm ${tab === "orders" ? "bg-primary text-primary-foreground" : "bg-paper"}`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setTab("products")}
              className={`rounded-full px-5 py-2.5 font-bold border-2 border-ink brutal-sm ${tab === "products" ? "bg-primary text-primary-foreground" : "bg-paper"}`}
            >
              Products ({products.length})
            </button>
            <button
              onClick={() => setTab("messages")}
              className={`rounded-full px-5 py-2.5 font-bold border-2 border-ink brutal-sm ${tab === "messages" ? "bg-primary text-primary-foreground" : "bg-paper"}`}
            >
              Messages ({contacts.length})
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">{unreadCount}</span>
              )}
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-muted-foreground">Loading...</p>
          ) : tab === "orders" ? (
            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap gap-3">
                {ORDER_STATUSES.map((s) => (
                  <span key={s} className="rounded-full bg-paper border-2 border-ink px-4 py-1.5 text-sm font-semibold brutal-sm">
                    {s}: {orderCounts[s] || 0}
                  </span>
                ))}
                <button onClick={exportOrdersCSV} className="ml-auto rounded-full bg-accent text-ink px-5 py-2.5 font-bold border-2 border-ink brutal-sm brutal-hover">
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border-2 border-ink bg-paper brutal">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-ink bg-muted/40">
                      <th className="px-4 py-3 text-left font-extrabold">Order</th>
                      <th className="px-4 py-3 text-left font-extrabold">Date</th>
                      <th className="px-4 py-3 text-left font-extrabold">Payment</th>
                      <th className="px-4 py-3 text-left font-extrabold">Total</th>
                      <th className="px-4 py-3 text-left font-extrabold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-ink/20">
                        <td className="px-4 py-3 font-mono">{o.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{o.payment_method}</td>
                        <td className="px-4 py-3 font-extrabold text-primary">EGP {o.total}</td>
                        <td className="px-4 py-3">
                          <select
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                            className="rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-sm focus:outline-none"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && <p className="px-4 py-6 text-muted-foreground">No orders yet.</p>}
              </div>
            </div>
          ) : tab === "products" ? (
            <div className="mt-8 grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 rounded-3xl border-2 border-ink bg-paper p-6 brutal">
                <h2 className="text-xl font-extrabold">{editingId ? "Edit Product" : "New Product"}</h2>
                <div className="mt-4 space-y-3">
                  {[
                    { key: "name", label: "Name", type: "text" },
                    { key: "price", label: "Price (EGP)", type: "number" },
                    { key: "badge", label: "Badge", type: "text" },
                    { key: "stock", label: "Stock", type: "number" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={((productForm as Record<string, string | number | undefined>)[f.key]) ?? ""}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold mb-1">Description</label>
                    <textarea
                      rows={5}
                      value={productForm.description ?? ""}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm focus:outline-none resize-none overflow-y-auto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Badge Tone</label>
                    <select
                      value={productForm.badge_tone || "primary"}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          badge_tone: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="primary">Primary</option>
                      <option value="accent">Accent</option>
                      <option value="mint">Mint</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full rounded-xl border-2 border-ink bg-paper px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-primary file:text-primary-foreground file:px-3 file:py-1 file:text-xs file:font-bold"
                    />
                    {uploadingImage && (
                      <p className="mt-1 text-xs text-muted-foreground">Uploading...</p>
                    )}
                    {productForm.image_url && (
                      <div className="mt-2">
                        <img
                          src={productForm.image_url}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-xl border-2 border-ink"
                        />
                        <p className="mt-1 text-xs text-muted-foreground truncate">{productForm.image_url}</p>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={productForm.active ?? true}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, active: e.target.checked }))}
                    />
                    Active
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={saveProduct}
                      className="flex-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 font-bold border-2 border-ink brutal brutal-hover text-sm"
                    >
                      {editingId ? "Update" : "Create"}
                    </button>
                    {editingId && (
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setProductForm({ active: true, stock: 0, price: 0 });
                        }}
                        className="rounded-full bg-paper px-4 py-2.5 font-bold border-2 border-ink brutal-sm text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border-2 border-ink bg-paper p-4 brutal-sm">
                    <div>
                      <strong className="block">{p.name}</strong>
                      <small className="text-muted-foreground">
                        EGP {p.price} · stock {p.stock} · {p.active ? "Active" : "Inactive"}
                      </small>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editProduct(p)}
                        className="rounded-full bg-accent text-ink px-3 py-1.5 text-xs font-bold border-2 border-ink brutal-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="rounded-full bg-paper px-3 py-1.5 text-xs font-bold border-2 border-ink brutal-sm hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="text-muted-foreground">No products yet.</p>}
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-3xl border-2 p-6 brutal-sm ${c.read ? "border-ink/30 bg-paper/70" : "border-ink bg-paper"}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!c.read && <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" />}
                        <strong className="text-lg">{c.subject}</strong>
                        <span className="text-xs text-muted-foreground">from {c.name} &lt;{c.email}&gt;</span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">{c.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => markContactRead(c.id, !c.read)}
                        className="rounded-full bg-accent text-ink px-4 py-2 font-bold border-2 border-ink brutal-sm text-xs"
                      >
                        {c.read ? "Mark Unread" : "Mark Read"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

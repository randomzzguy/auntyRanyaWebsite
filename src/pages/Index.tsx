import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import heroBooks from "@/assets/hero-books.jpg";
import aboutAuthor from "@/assets/about-author.jpg";
import { toast } from "sonner";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const SERVICES = [
  { icon: "✍️", title: "Custom Story Writing", desc: "Unique stories crafted for your vision" },
  { icon: "🔍", title: "Editing & Proofreading", desc: "Polishing manuscripts to perfection" },
  { icon: "🎨", title: "Character Concepts", desc: "Illustration ideas that come alive" },
  { icon: "📚", title: "Book Development", desc: "From concept to published book" },
];

const FEATURES = ["🌍 3+ Languages", "📖 Multilingual Stories", "✍️ Custom Stories", "🎨 Tailored for You"];

const shippingSchema = z.object({
  first: z.string().min(1, "First name is required"),
  last: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(6, "Phone is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  gov: z.string().min(1, "Governorate is required"),
  zip: z.string().min(1, "Postal code is required"),
  notes: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(5, "Message is too short"),
});

export default function Index() {
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();
  const { cart, total, count, addToCart, removeItem, clearCart, updateQty } = useCart();
  const { user, isAdmin } = useAuth();

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [navOpen, setNavOpen] = useState(false);
  const [ship, setShip] = useState({ first: "", last: "", email: "", phone: "", address: "", city: "", gov: "", zip: "", notes: "" });
  const [shipErrors, setShipErrors] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState<"cod" | "vodafone" | "bank">("cod");
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => {
    document.body.style.overflow = cartOpen || checkoutOpen || productModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, checkoutOpen, productModalOpen]);

  const closePanels = () => {
    setCartOpen(false);
    setCheckoutOpen(false);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setModalQty(1);
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    setProductModalOpen(false);
    setSelectedProduct(null);
  };

  const addModalProductToCart = () => {
    if (!selectedProduct) return;
    const existing = cart.find((c) => c.id === selectedProduct.id);
    if (existing) {
      updateQty(selectedProduct.id, existing.qty + modalQty);
    } else {
      addToCart(selectedProduct);
      if (modalQty > 1) {
        updateQty(selectedProduct.id, modalQty);
      }
    }
    toast.success(`${modalQty} × ${selectedProduct.name} added to cart`);
    closeProductModal();
    setCartOpen(true);
  };

  const paymentLabel = { cod: "Cash on Delivery", vodafone: "Vodafone Cash", bank: "Bank Transfer" }[payment];

  const validateShipping = () => {
    const result = shippingSchema.safeParse(ship);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        errs[e.path[0]] = e.message;
      });
      setShipErrors(errs);
      return false;
    }
    setShipErrors({});
    return true;
  };

  const placeOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place an order.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setPlacing(true);
    try {
      const items = cart.map((i) => ({ product_id: i.id, qty: i.qty }));
      const { data, error } = await supabase.rpc("place_order", {
        p_shipping_json: ship,
        p_payment_method: payment,
        p_items: items,
      });
      if (error) {
        console.error("[placeOrder] RPC error:", error);
        throw new Error(error.message || "Failed to place order.");
      }
      const result = data as { order_id: string; total: number } | null;
      if (!result) throw new Error("No response from server");
      setOrderId(result.order_id);
      setStep(4);
      clearCart();
      toast.success(`Order placed! ID: ${result.order_id.slice(0, 8)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order.";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  const onContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries());
    const result = contactSchema.safeParse(obj);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    toast.success("Message sent! We'll get back to you soon.");
    e.currentTarget.reset();
  };

  const jsonLdProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      image: p.image,
      description: p.desc,
      offers: {
        "@type": "Offer",
        priceCurrency: "EGP",
        price: p.price,
        availability: "https://schema.org/InStock",
      },
    }));
  }, [products]);

  return (
    <>
      <Helmet>
        <title>Ranya Ibrahim Ahmed — Imaginative Children's Books</title>
        <meta name="description" content="Imaginative children's books, custom story writing, editing & character concepts by author Ranya Ibrahim Ahmed." />
        <script type="application/ld+json">{JSON.stringify(jsonLdProducts)}</script>
      </Helmet>
      <div className="min-h-screen text-foreground">
        {/* HEADER */}
        <header className="fixed top-0 inset-x-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur">
          <div className="container flex items-center justify-between py-3">
            <a href="#home" className="flex items-center gap-2 font-display text-xl font-extrabold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-ink brutal-sm">R</span>
              <span>Ibrahim<span className="text-primary">.</span> Ahmed</span>
            </a>
            <nav className={`${navOpen ? "flex" : "hidden"} md:flex absolute md:static top-full left-0 right-0 md:top-auto flex-col md:flex-row gap-4 md:gap-8 bg-paper md:bg-transparent border-b-2 md:border-0 border-ink p-5 md:p-0 font-medium`}>
              {[["Home", "#home"], ["About", "#about"], ["Store", "#store"], ["Contact", "#contact"]].map(([l, h]) => (
                <a key={h} href={h} onClick={() => setNavOpen(false)} className="relative w-fit hover:text-primary transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-0 after:bg-primary hover:after:w-full after:transition-all">{l}</a>
              ))}
              {user && (
                <>
                  <Link to="/account" onClick={() => setNavOpen(false)} className="relative w-fit hover:text-primary transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-0 after:bg-primary hover:after:w-full after:transition-all">Account</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setNavOpen(false)} className="relative w-fit hover:text-primary transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-0 after:bg-primary hover:after:w-full after:transition-all">Admin</Link>
                  )}
                </>
              )}
              {!user && (
                <Link to="/login" onClick={() => setNavOpen(false)} className="relative w-fit hover:text-primary transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-0 after:bg-primary hover:after:w-full after:transition-all">Sign In</Link>
              )}
            </nav>
            <div className="flex items-center gap-3">
              <button onClick={() => setCartOpen(true)} aria-label="Open cart" className="relative h-11 w-11 rounded-full bg-accent border-2 border-ink brutal-sm hover:translate-y-[-2px] transition-transform flex items-center justify-center text-lg">
                🛒
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 h-6 min-w-6 px-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold border-2 border-ink flex items-center justify-center">{count}</span>
                )}
              </button>
              <button onClick={() => setNavOpen((o) => !o)} className="md:hidden h-11 w-11 rounded-full border-2 border-ink bg-paper flex items-center justify-center" aria-label="Menu">☰</button>
            </div>
          </div>
        </header>

      {/* HERO */}
      <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-mint/40 blur-2xl" aria-hidden />
        <div className="absolute top-40 -right-10 h-80 w-80 rounded-full bg-accent/40 blur-2xl" aria-hidden />
        <div className="container relative grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-7 rise">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper px-4 py-1.5 text-sm font-semibold brutal-sm">
              <span className="h-2 w-2 rounded-full bg-primary" /> Children's Book Author & Editor
            </span>
            <h1 className="mt-6 text-5xl md:text-7xl lg:text-8xl">
              Imaginative <span className="italic font-light">Children's Books</span><br />
              That <span className="relative inline-block text-primary">
                Spark
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                  <path d="M2 8 Q 50 -2 100 6 T 198 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span> Curiosity.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Stories crafted to inspire reading, learning, and creativity—one page at a time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#store" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3.5 font-bold border-2 border-ink brutal brutal-hover">
                Browse Books →
              </a>
              <a href="#about" className="inline-flex items-center gap-2 rounded-full bg-paper px-7 py-3.5 font-bold border-2 border-ink brutal-sm brutal-hover">
                Learn More
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {FEATURES.map((f) => (
                <span key={f} className="rounded-full bg-paper px-4 py-2 text-sm font-semibold border-2 border-ink brutal-sm">{f}</span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
              <div className="tape left-1/2 -top-3 -translate-x-1/2" />
              <div className="rounded-3xl border-2 border-ink bg-paper p-3 brutal-lg">
                <img src={heroBooks} alt="Stack of children's books with a curious fox" width={1024} height={1024} className="w-full h-auto rounded-2xl" />
              </div>
              <div className="absolute -top-6 -left-8 wiggle text-5xl" aria-hidden>📚</div>
              <div className="absolute -bottom-4 -right-6 float-slow text-4xl" style={{ '--r': '12deg' } as React.CSSProperties} aria-hidden>✨</div>
              <div className="absolute -bottom-10 left-6 rotate-[-8deg] rounded-full bg-accent border-2 border-ink px-4 py-2 font-hand text-xl brutal-sm">
                Once upon a time...
              </div>
            </div>
          </div>
        </div>

        {/* marquee */}
        <div className="mt-24 overflow-hidden border-y-2 border-ink bg-secondary text-secondary-foreground py-4">
          <div className="marquee whitespace-nowrap font-display text-2xl">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-10 pr-10">
                {["Imagination", "★", "Curiosity", "★", "Wonder", "★", "Stories", "★", "Learning", "★", "Adventure", "★"].map((w, i) => (
                  <span key={i} className={i % 2 ? "text-accent" : ""}>{w}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24">
        <div className="container grid lg:grid-cols-2 gap-14 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 rounded-3xl bg-primary/15 -rotate-3" />
            <div className="relative rotate-2 rounded-3xl border-2 border-ink bg-paper p-3 brutal-lg">
              <img src={aboutAuthor} alt="Ranya Ibrahim Ahmed at her desk" width={1024} height={1024} loading="lazy" className="w-full h-auto rounded-2xl" />
            </div>
            <div className="absolute -bottom-6 -right-4 rotate-[6deg] bg-secondary text-secondary-foreground px-5 py-3 rounded-2xl border-2 border-ink brutal font-hand text-2xl">
              Hello, friend!
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-block rounded-full bg-mint/30 border-2 border-ink px-4 py-1.5 text-sm font-semibold brutal-sm">Dedicated Author | Inspiring Young Minds</span>
            <h2 className="mt-5 text-4xl md:text-5xl">
              About <span className="italic">Ranya</span> Ibrahim Ahmed
            </h2>
            <div className="mt-3 h-1.5 w-20 bg-primary rounded-full" />
            <p className="mt-6 text-lg text-muted-foreground">
              Ranya Ibrahim Ahmed creates imaginative, age-appropriate children's books designed to nurture a love of reading and learning. With a focus on creative storytelling, she helps young readers explore big ideas through engaging characters and memorable adventures.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Ranya also supports authors and publishers through custom story writing, children's book editing and proofreading, and character/illustration concept development. Whether you're building a new picture book from scratch or polishing a manuscript for publication, her goal is the same: to deliver clear, warm, child-friendly stories that inspire creativity and confidence in every reader.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-24 border-y-2 border-ink bg-mint/15">
        <div className="container">
          <div className="max-w-2xl">
            <span className="font-hand text-3xl text-primary">— what I offer</span>
            <h2 className="mt-2 text-4xl md:text-5xl">What I Offer</h2>
            <p className="mt-4 text-lg text-muted-foreground">Expert services tailored to bring your children's literature vision to life.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <div key={s.title} className={`relative rounded-3xl border-2 border-ink bg-paper p-7 brutal brutal-hover ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                <div className={`h-14 w-14 rounded-2xl border-2 border-ink flex items-center justify-center text-3xl ${["bg-primary/20","bg-accent/40","bg-mint/40","bg-secondary/15"][i]}`}>{s.icon}</div>
                <h4 className="mt-5 text-xl font-extrabold">{s.title}</h4>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
                <span className="absolute top-3 right-4 font-hand text-lg text-muted-foreground">0{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-secondary text-secondary-foreground p-10 md:p-16 brutal-lg">
            <div className="absolute -top-6 -left-6 text-[10rem] opacity-10 rotate-[-15deg]" aria-hidden>📖</div>
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-primary/40 blur-3xl" aria-hidden />
            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-xl">
                <span className="font-hand text-3xl text-accent">psst!</span>
                <h2 className="mt-2 text-4xl md:text-5xl text-secondary-foreground">Bring Your Children's Story to Life</h2>
                <p className="mt-4 text-lg opacity-90">Custom stories, expert editing, and character concepts for books kids love.</p>
              </div>
              <a href="#store" className="inline-flex w-fit items-center gap-2 rounded-full bg-accent text-ink px-7 py-3.5 font-bold border-2 border-ink brutal brutal-hover">
                Explore the Store →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STORE */}
      <section id="store" className="py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="font-hand text-3xl text-primary">— shop</span>
              <h2 className="mt-2 text-4xl md:text-5xl">Store</h2>
              <p className="mt-4 text-lg text-muted-foreground">New Arrivals. Discover books and services designed to inspire young readers and support fellow authors.</p>
            </div>
            <span className="self-start md:self-end rounded-full border-2 border-ink bg-accent px-4 py-1.5 text-sm font-bold brutal-sm">{products ? `${products.length} items` : "Loading..."}</span>
          </div>

          {productsLoading && <p className="mt-8 text-muted-foreground">Loading products...</p>}
          {productsError && <p className="mt-8 text-destructive">Failed to load products.</p>}

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {products?.map((p, i) => {
              const tone = p.badgeTone === "primary" ? "bg-primary text-primary-foreground" : p.badgeTone === "accent" ? "bg-accent text-ink" : "bg-mint text-ink";
              return (
                <article key={p.id} onClick={() => openProductModal(p)} className={`cursor-pointer group relative rounded-3xl border-2 border-ink bg-paper overflow-hidden brutal brutal-hover ${i === 1 ? "lg:translate-y-6" : ""}`}>
                  <span className={`absolute top-4 left-4 z-10 rounded-full px-3 py-1 text-xs font-bold border-2 border-ink ${tone}`}>{p.badge}</span>
                  <div className="aspect-square overflow-hidden border-b-2 border-ink bg-muted">
                    <img src={p.image} alt={p.name} width={768} height={768} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold leading-tight">{p.name}</h3>
                    <p className="mt-2 text-muted-foreground text-sm line-clamp-2">{p.desc}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <span className="font-display text-2xl font-extrabold text-primary">EGP {p.price}</span>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(p); }} className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-bold border-2 border-ink hover:bg-primary hover:text-primary-foreground transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 border-t-2 border-ink bg-accent/15">
        <div className="container grid lg:grid-cols-2 gap-12">
          <div className="rounded-3xl border-2 border-ink bg-paper p-8 brutal">
            <h3 className="text-2xl font-extrabold">Send a Message</h3>
            <form className="mt-6 space-y-4" onSubmit={onContactSubmit}>
              {[
                { id: "name", label: "Full Name", type: "text" },
                { id: "email", label: "Email", type: "email" },
                { id: "subject", label: "Subject", type: "text" },
              ].map((f) => (
                <div key={f.id}>
                  <label className="block text-sm font-semibold mb-1.5" htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} name={f.id} type={f.type} required className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 focus:outline-none focus:bg-accent/20 transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold mb-1.5" htmlFor="message">Message</label>
                <textarea id="message" name="message" rows={4} required className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 focus:outline-none focus:bg-accent/20 transition-colors" />
              </div>
              <button type="submit" className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal brutal-hover">
                Send Message →
              </button>
            </form>
          </div>

          <div>
            <span className="font-hand text-3xl text-primary">— say hi</span>
            <h3 className="mt-2 text-4xl md:text-5xl">Get in Touch</h3>
            <p className="mt-4 text-lg text-muted-foreground">Have a question or want to work together? Reach out anytime.</p>
            <div className="mt-8 space-y-5">
              {[
                { icon: "📍", title: "Location", body: <p>Alexandria, Egypt</p> },
                { icon: "📞", title: "Phone & Email", body: <p><a className="text-primary font-semibold underline-offset-4 hover:underline" href="tel:+2001070059199">+20-01070059199</a><br /><a className="text-primary font-semibold underline-offset-4 hover:underline" href="mailto:aroaajm@gmail.com">aroaajm@gmail.com</a></p> },
                { icon: "⏰", title: "Working Hours", body: <p>Sun–Thu: 08:00–19:00</p> },
              ].map((it) => (
                <div key={it.title} className="flex gap-4 rounded-2xl border-2 border-ink bg-paper p-5 brutal-sm">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-accent border-2 border-ink flex items-center justify-center text-xl">{it.icon}</div>
                  <div>
                    <strong className="block">{it.title}</strong>
                    <div className="text-muted-foreground">{it.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink text-paper pt-16 pb-8 border-t-2 border-ink">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="font-display text-2xl font-extrabold">Ranya Ibrahim Ahmed</div>
            <p className="mt-3 text-paper/70">Imaginative children's books designed to nurture a love of reading and learning.</p>
          </div>
          <div>
            <h4 className="text-paper text-lg font-extrabold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-paper/80">
              {[["Home", "#home"], ["About", "#about"], ["Store", "#store"], ["Contact", "#contact"]].map(([l, h]) => (
                <li key={h}><a href={h} className="hover:text-accent transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-paper text-lg font-extrabold mb-4">Legal</h4>
            <ul className="space-y-2 text-paper/80">
              {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Refund Policy", "/refund"], ["Shipping Policy", "/shipping"]].map(([l, h]) => (
                <li key={h}><Link to={h} className="hover:text-accent transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-paper text-lg font-extrabold mb-4">Contact</h4>
            <p className="text-paper/80">Alexandria, Egypt<br />+20-01070059199<br />aroaajm@gmail.com</p>
          </div>
        </div>
        <div className="container mt-12 pt-6 border-t border-paper/20 text-center text-paper/60 text-sm">
          © {new Date().getFullYear()} Ranya Ibrahim Ahmed. All rights reserved.
        </div>
      </footer>

      {/* OVERLAY */}
      {(cartOpen || checkoutOpen) && (
        <div onClick={closePanels} className="fixed inset-0 bg-ink/60 z-[60] backdrop-blur-sm" />
      )}

      {/* CART PANEL */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-paper z-[70] border-l-2 border-ink shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b-2 border-ink">
          <h3 className="text-2xl font-extrabold">Shopping Cart</h3>
          <button onClick={closePanels} className="h-10 w-10 rounded-full border-2 border-ink hover:bg-accent" aria-label="Close cart">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center mt-16 text-muted-foreground">
              <div className="text-5xl mb-3">🛍️</div>
              Your cart is empty.<br />Add some books to get started!
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-paper p-4 brutal-sm">
                  <div>
                    <strong className="block">{item.name}</strong>
                    <small className="text-muted-foreground">{item.qty} × EGP {item.price}</small>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-sm font-semibold rounded-full border-2 border-ink px-3 py-1.5 hover:bg-destructive hover:text-destructive-foreground">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-6 border-t-2 border-ink bg-muted/40">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>EGP {total}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
            <div className="flex justify-between text-lg font-extrabold border-t-2 border-ink pt-2 mt-2"><span>Total</span><span>EGP {total}</span></div>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => { setCartOpen(false); setStep(1); setCheckoutOpen(true); }}
            className="mt-4 w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal disabled:opacity-50 disabled:brutal-sm">
            Proceed to Checkout
          </button>
        </div>
      </aside>

      {/* CHECKOUT PANEL */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-paper z-[70] border-l-2 border-ink shadow-2xl transition-transform duration-300 ${checkoutOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b-2 border-ink">
          <h3 className="text-2xl font-extrabold">Checkout</h3>
          <button onClick={closePanels} className="h-10 w-10 rounded-full border-2 border-ink hover:bg-accent" aria-label="Close checkout">✕</button>
        </div>

        {step !== 4 && (
          <div className="flex items-center px-6 pt-5">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className={`h-9 w-9 rounded-full border-2 border-ink flex items-center justify-center font-bold ${step >= (n as 1|2|3) ? "bg-primary text-primary-foreground" : "bg-paper"}`}>{n}</div>
                {i < 2 && <div className={`flex-1 h-1 mx-2 ${step > (n as 1|2|3) ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-extrabold">Shipping Information</h4>
              {([
                ["First Name *", "first", "text"],
                ["Last Name *", "last", "text"],
                ["Email Address *", "email", "email"],
                ["Phone Number *", "phone", "tel"],
                ["Address *", "address", "text"],
              ] as const).map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(ship as Record<string, string>)[key]}
                    onChange={(e) => setShip({ ...ship, [key]: e.target.value })}
                    className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 focus:outline-none focus:bg-accent/20"
                  />
                  {shipErrors[key] && <p className="mt-1 text-xs text-destructive">{shipErrors[key]}</p>}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">City *</label>
                  <input value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
                  {shipErrors.city && <p className="mt-1 text-xs text-destructive">{shipErrors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Governorate *</label>
                  <input value={ship.gov} onChange={(e) => setShip({ ...ship, gov: e.target.value })} className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
                  {shipErrors.gov && <p className="mt-1 text-xs text-destructive">{shipErrors.gov}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Postal Code *</label>
                <input value={ship.zip} onChange={(e) => setShip({ ...ship, zip: e.target.value })} className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
                {shipErrors.zip && <p className="mt-1 text-xs text-destructive">{shipErrors.zip}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Order Notes (Optional)</label>
                <textarea value={ship.notes} onChange={(e) => setShip({ ...ship, notes: e.target.value })} className="w-full rounded-xl border-2 border-ink bg-paper px-4 py-3" />
              </div>

              <div className="rounded-2xl border-2 border-ink bg-muted/40 p-4 mt-2">
                <h5 className="font-extrabold mb-2">Order Summary</h5>
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>EGP {total}</span></div>
                <div className="flex justify-between text-sm"><span>Shipping</span><span>Free</span></div>
                <div className="flex justify-between font-extrabold border-t border-ink/30 mt-2 pt-2"><span>Total</span><span>EGP {total}</span></div>
              </div>
              <button onClick={() => { if (validateShipping()) setStep(2); }} className="w-full rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal">Continue to Payment</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-lg font-extrabold">Payment Method</h4>
              <div className="space-y-3">
                {([
                  ["cod", "Cash on Delivery", "Pay when you receive your order"],
                  ["vodafone", "Vodafone Cash", "Send payment via Vodafone Cash"],
                  ["bank", "Bank Transfer", "Direct bank transfer"],
                ] as const).map(([val, title, sub]) => (
                  <label key={val} className={`flex items-center gap-3 rounded-2xl border-2 border-ink p-4 cursor-pointer transition-colors ${payment === val ? "bg-accent/40" : "bg-paper hover:bg-muted/40"}`}>
                    <input type="radio" name="pay" checked={payment === val} onChange={() => setPayment(val)} className="accent-[hsl(var(--primary))] h-4 w-4" />
                    <div><strong>{title}</strong><br /><small className="text-muted-foreground">{sub}</small></div>
                  </label>
                ))}
              </div>
              <div className="rounded-2xl border-2 border-ink bg-muted/40 p-4 text-sm">
                <strong>Shipping To:</strong> {ship.first} {ship.last}{ship.city ? `, ${ship.city}` : ""}
              </div>
              <div className="flex justify-between font-extrabold border-2 border-ink rounded-2xl px-4 py-3"><span>Total</span><span>EGP {total}</span></div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-full bg-paper px-6 py-3.5 font-bold border-2 border-ink">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal">Review Order</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-extrabold">Review Your Order</h4>
              <div className="rounded-2xl border-2 border-ink bg-muted/40 p-4 space-y-2">
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm"><span>{i.name} × {i.qty}</span><span>{i.price * i.qty} EGP</span></div>
                ))}
                <div className="flex justify-between font-extrabold border-t border-ink/30 pt-2 mt-2"><span>Payment Method</span><span>{paymentLabel}</span></div>
              </div>
              <div className="flex justify-between font-extrabold border-2 border-ink rounded-2xl px-4 py-3"><span>Final Total</span><span>EGP {total}</span></div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 rounded-full bg-paper px-6 py-3.5 font-bold border-2 border-ink">Back</button>
                <button onClick={placeOrder} disabled={placing} className="flex-[2] rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal disabled:opacity-50">
                  {placing ? "Placing Order..." : "Place Order"}
                </button>
              </div>
              {!user && <p className="text-xs text-destructive">Please sign in to place an order.</p>}
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl text-primary">Order Placed!</h2>
              {orderId && <p className="mt-2 text-sm text-muted-foreground">Order ID: {orderId.slice(0, 8)}</p>}
              <p className="mt-3 text-muted-foreground">Thank you for your order! You'll receive a confirmation email shortly with your order details.</p>
              <button onClick={() => { closePanels(); setStep(1); }} className="mt-6 rounded-full bg-primary text-primary-foreground px-6 py-3.5 font-bold border-2 border-ink brutal">Continue Shopping</button>
            </div>
          )}
        </div>
      </aside>
    </div>

    {/* Product Detail Modal */}
    {productModalOpen && selectedProduct && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
        onClick={closeProductModal}
      >
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-ink bg-paper brutal shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeProductModal}
            className="absolute top-4 right-4 z-10 rounded-full bg-paper border-2 border-ink px-3 py-2 font-bold text-sm brutal-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            ✕
          </button>
          <div className="aspect-video overflow-hidden border-b-2 border-ink bg-muted">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="h-full w-full object-cover" />
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold border-2 border-ink mb-2 ${selectedProduct.badgeTone === "primary" ? "bg-primary text-primary-foreground" : selectedProduct.badgeTone === "accent" ? "bg-accent text-ink" : "bg-mint text-ink"}`}>
                  {selectedProduct.badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">{selectedProduct.name}</h3>
              </div>
              <span className="font-display text-3xl font-extrabold text-primary whitespace-nowrap">EGP {selectedProduct.price}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{selectedProduct.desc}</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center rounded-full border-2 border-ink bg-paper overflow-hidden brutal-sm">
                <button
                  onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 font-bold hover:bg-accent/30 transition-colors"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-sm">{modalQty}</span>
                <button
                  onClick={() => setModalQty((q) => q + 1)}
                  className="px-4 py-2 font-bold hover:bg-accent/30 transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={addModalProductToCart}
                className="flex-1 rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold border-2 border-ink brutal brutal-hover text-sm"
              >
                Add {modalQty} to Cart — EGP {selectedProduct.price * modalQty}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

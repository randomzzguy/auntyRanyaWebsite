import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Product = {
  id: string;
  name: string;
  price: number;
  badge: string;
  badgeTone: "primary" | "accent" | "mint";
  image: string;
  desc: string;
};

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    badge: p.badge || "",
    badgeTone: (p.badge_tone as "primary" | "accent" | "mint") || "primary",
    image: p.image_url || "",
    desc: p.description || "",
  }));
};

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    toast.success(`${product.name} added to cart`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Elegant Women's Fashion
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our curated collection of timeless pieces
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="container mx-auto px-4 py-16">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                No products available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Shop;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Create customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerData.id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          total_amount: total,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Order placed successfully!");
      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">
              Start shopping to add items to your cart
            </p>
            <Button onClick={() => navigate("/")}>Continue Shopping</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-lg text-primary font-bold">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      required
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      required
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mb-4">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
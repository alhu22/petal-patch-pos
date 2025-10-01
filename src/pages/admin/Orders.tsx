import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["pending", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      console.error("Error fetching order items:", error);
      toast.error("Failed to load order details");
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setDialogOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Order status updated");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: "Pending" },
      processing: { variant: "default", label: "Processing" },
      delivered: { variant: "default", label: "Delivered" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className={status === "processing" ? "bg-info" : status === "delivered" ? "bg-success" : ""}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Orders</h1>
          <p className="text-muted-foreground">
            Manage pending and processing orders
          </p>
        </div>

        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customer_phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedOrder.customer_name}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedOrder.customer_phone}
                      </div>
                      {selectedOrder.customer_email && (
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {selectedOrder.customer_email}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Address:</span>{" "}
                        {selectedOrder.customer_address}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Order ID:</span>{" "}
                        {selectedOrder.id}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {format(new Date(selectedOrder.created_at), "PPpp")}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ${item.subtotal.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            ${selectedOrder.total_amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
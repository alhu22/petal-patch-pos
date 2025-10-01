import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, Search } from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/AdminLayout";

interface DeliveredOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  created_at: string;
  delivered_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const AdminHistory = () => {
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DeliveredOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DeliveredOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer_phone.includes(searchQuery) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const fetchDeliveredOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "delivered")
        .order("delivered_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Error fetching delivered orders:", error);
      toast.error("Failed to load order history");
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

  const handleViewOrder = async (order: DeliveredOrder) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setDialogOpen(true);
  };

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">View all delivered orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                ${totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(2) : "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, phone, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivered Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    {searchQuery
                      ? "No orders found matching your search"
                      : "No delivered orders yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
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
                    <TableCell>
                      {order.delivered_at
                        ? format(new Date(order.delivered_at), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total_amount.toFixed(2)}
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
                        <span className="font-medium">Order Date:</span>{" "}
                        {format(new Date(selectedOrder.created_at), "PPpp")}
                      </div>
                      <div>
                        <span className="font-medium">Delivered Date:</span>{" "}
                        {selectedOrder.delivered_at
                          ? format(new Date(selectedOrder.delivered_at), "PPpp")
                          : "N/A"}
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

export default AdminHistory;
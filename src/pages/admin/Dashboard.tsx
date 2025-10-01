import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface Stats {
  totalIncome: number;
  dailyIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  totalProfit: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalIncome: 0,
    dailyIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    totalProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      toast.error("Unauthorized access");
      await supabase.auth.signOut();
      navigate("/admin/login");
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all orders
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, created_at, status");

      // Fetch products with costs
      const { data: products } = await supabase
        .from("products")
        .select("stock_quantity, low_stock_threshold, cost");

      // Fetch order items to calculate profit
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("subtotal, product_id, quantity");

      const { data: productsForProfit } = await supabase
        .from("products")
        .select("id, cost");

      let totalRevenue = 0;
      let dailyRevenue = 0;
      let weeklyRevenue = 0;
      let monthlyRevenue = 0;
      let pending = 0;
      let processing = 0;
      let delivered = 0;

      orders?.forEach((order) => {
        totalRevenue += Number(order.total_amount);
        const orderDate = new Date(order.created_at);

        if (orderDate >= today) dailyRevenue += Number(order.total_amount);
        if (orderDate >= weekAgo) weeklyRevenue += Number(order.total_amount);
        if (orderDate >= monthAgo) monthlyRevenue += Number(order.total_amount);

        if (order.status === "pending") pending++;
        if (order.status === "processing") processing++;
        if (order.status === "delivered") delivered++;
      });

      // Calculate profit
      let totalCost = 0;
      orderItems?.forEach((item) => {
        const product = productsForProfit?.find((p) => p.id === item.product_id);
        if (product) {
          totalCost += Number(product.cost) * item.quantity;
        }
      });

      const totalProfit = totalRevenue - totalCost;

      const lowStock = products?.filter(
        (p) => p.stock_quantity <= p.low_stock_threshold
      ).length || 0;

      setStats({
        totalIncome: totalRevenue,
        dailyIncome: dailyRevenue,
        weeklyIncome: weeklyRevenue,
        monthlyIncome: monthlyRevenue,
        totalProducts: products?.length || 0,
        lowStockProducts: lowStock,
        pendingOrders: pending,
        processingOrders: processing,
        deliveredOrders: delivered,
        totalProfit,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Income Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Daily Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.dailyIncome.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Weekly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.weeklyIncome.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Profit & Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${stats.totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue - Costs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className={stats.lowStockProducts > 0 ? "border-warning" : ""}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {stats.lowStockProducts}
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => navigate("/admin/products")}
              >
                View products
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Orders Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() => navigate("/admin/orders")}
              >
                Manage orders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <ShoppingCart className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processingOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <ShoppingCart className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveredOrders}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
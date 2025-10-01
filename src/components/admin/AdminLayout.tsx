import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingCart, FileText } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/history", label: "History", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <nav className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Link to="/admin/dashboard" className="font-bold text-xl text-primary">
              Bella Boutique Admin
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
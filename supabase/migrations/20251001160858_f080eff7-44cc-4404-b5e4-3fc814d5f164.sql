-- Create enum for order status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'delivered', 'cancelled');

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Create admin_users table for admin authentication
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Products policies (public can read, admin can manage)
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Customers policies (admin only)
CREATE POLICY "Admin can view customers" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin can manage customers" ON customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Orders policies (admin can manage)
CREATE POLICY "Admin can view orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin can manage orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Order items policies (admin can manage)
CREATE POLICY "Admin can view order_items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin can manage order_items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Admin users policies
CREATE POLICY "Admin users can view themselves" ON admin_users
  FOR SELECT USING (id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
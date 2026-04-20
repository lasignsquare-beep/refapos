-- 1. Users Table
CREATE TABLE pos_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- (Run this to give yourself a login to start with)
INSERT INTO pos_users (username, password, role, name) 
VALUES ('admin', 'admin123', 'admin', 'System Admin');

-- 2. Products Table
CREATE TABLE pos_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT DEFAULT 'Other',
  sku TEXT,
  price NUMERIC NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  low_stock_threshold INT NOT NULL DEFAULT 5,
  department TEXT DEFAULT 'Refabit Technologies',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Transactions Table
CREATE TABLE pos_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL,
  customer TEXT,
  cashier_name TEXT NOT NULL,
  department TEXT DEFAULT 'Refabit Technologies',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transaction Items Table
CREATE TABLE pos_transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT DEFAULT 'Other',
  price NUMERIC NOT NULL,
  quantity INT NOT NULL,
  unit TEXT DEFAULT 'pcs',
  subtotal NUMERIC NOT NULL,
  description TEXT
);

-- 5. Stock Log Table
CREATE TABLE pos_stock_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID,
  product_name TEXT NOT NULL,
  delta INT NOT NULL,
  reason TEXT,
  adjusted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

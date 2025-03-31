-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;

-- Enums for status
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
CREATE TYPE order_status AS ENUM ('OPEN', 'APPROVED', 'CONFIRMED', 'SENT', 'COMPLETED', 'CANCELLED');

-- Create tables
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status cart_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  cart_id UUID REFERENCES carts(id),
  total DECIMAL(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'OPEN',
  payment JSONB,
  delivery JSONB,
  comments TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  comment TEXT
);

-- Insert test data
-- Test user cart
INSERT INTO carts (id, user_id, status, created_at, updated_at)
VALUES 
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '0db732f6-e540-4b45-bc29-2b1652829dff', 'OPEN', '2025-03-29 13:32:45.417', '2025-03-30 07:05:03.817');

-- Cart items
INSERT INTO cart_items (cart_id, product_id, count)
VALUES
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9345-fc73c48a80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9345-fc73c48f80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9645-fc73c48f80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9645-fc71c48f80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9645-fc71c48v80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9645-fc71c68v80aa', 2),
  ('337c4651-05e3-4cca-bd6e-442c0d2d3aa9', '7567ec4b-b10c-48c5-9645-nc71c68v80aa', 2);

-- Sample completed order
INSERT INTO orders (id, user_id, cart_id, total, status, payment, delivery, comments)
VALUES
  (
    uuid_generate_v4(),
    '0db732f6-e540-4b45-bc29-2b1652829dff',
    '337c4651-05e3-4cca-bd6e-442c0d2d3aa9',
    139.93,
    'COMPLETED',
    '{"type": "credit_card", "number": "XXXX-XXXX-XXXX-1234", "owner": "Test User"}',
    '{"address": "123 Test St.", "city": "Test City", "zipcode": "12345"}',
    'Test order from initialization script'
  );

-- Add status history for the first order
INSERT INTO status_history (order_id, status, comment)
SELECT 
  id, 
  'OPEN', 
  'Order created from init script'
FROM orders 
LIMIT 1;

INSERT INTO status_history (order_id, status, comment)
SELECT 
  id, 
  'APPROVED', 
  'Payment successful'
FROM orders 
LIMIT 1;

INSERT INTO status_history (order_id, status, comment)
SELECT 
  id, 
  'COMPLETED', 
  'Order delivered'
FROM orders 
LIMIT 1;

-- Create indexes for better performance
CREATE INDEX idx_cart_user_id ON carts(user_id);
CREATE INDEX idx_order_user_id ON orders(user_id);
CREATE INDEX idx_status_history_order_id ON status_history(order_id);
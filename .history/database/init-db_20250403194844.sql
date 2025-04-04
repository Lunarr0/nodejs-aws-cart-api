-- Drop tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TYPE IF EXISTS cart_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Create custom types for enums
CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');
CREATE TYPE order_status AS ENUM (
    'OPEN'
    'ORDERED',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
);

-- Create carts table
CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status cart_status NOT NULL DEFAULT 'OPEN'
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    count INTEGER NOT NULL CHECK (count > 0),
    UNIQUE(cart_id, product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cart_id UUID NOT NULL REFERENCES carts(id),
    payment JSONB,
    delivery JSONB,
    comments TEXT,
    status order_status NOT NULL DEFAULT 'ORDERED',
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_history JSONB DEFAULT '[]'::jsonb
);

-- Create indexes
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_status ON carts(status);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_cart_id ON orders(cart_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Insert test data
INSERT INTO products (id, title, description, price) VALUES 
    ('123e4567-e89b-12d3-a456-426614174001', 'Product 1', 'Description for product 1', 14.99),
    ('123e4567-e89b-12d3-a456-426614174002', 'Product 2', 'Description for product 2', 24.99);

INSERT INTO carts (id, user_id, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '123e4567-e89b-12d3-a456-426614174000', 'OPEN'),
    ('550e8400-e29b-41d4-a716-446655440001', '123e4567-e89b-12d3-a456-426614174000', 'ORDERED');

INSERT INTO cart_items (cart_id, product_id, count) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '123e4567-e89b-12d3-a456-426614174001', 2),
    ('550e8400-e29b-41d4-a716-446655440000', '123e4567-e89b-12d3-a456-426614174002', 1);

INSERT INTO orders (id, user_id, cart_id, status, total, delivery, payment) VALUES 
    ('650e8400-e29b-41d4-a716-446655440000', 
     '123e4567-e89b-12d3-a456-426614174000', 
     '550e8400-e29b-41d4-a716-446655440001', 
     'ORDERED',
     29.98,
     '{"address": "123 Main St", "city": "New York", "country": "USA", "postalCode": "10001", "contactNumber": "123-456-7890"}'::jsonb,
     '{"method": "credit_card", "status": "completed", "amount": 29.98}'::jsonb
    );

-- Create or replace update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for carts table
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

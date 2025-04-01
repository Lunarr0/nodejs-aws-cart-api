-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) CHECK (status IN ('OPEN', 'ORDERED'))
);

-- Create cart_items table
CREATE TABLE cart_items (
    cart_id UUID REFERENCES carts(id),
    product_id UUID,
    count INTEGER NOT NULL,
    PRIMARY KEY (cart_id, product_id)  -- Composite key to avoid duplicates
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    cart_id UUID REFERENCES carts(id),
    payment JSON,
    delivery JSON,
    comments TEXT,
    status VARCHAR(10) CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    total NUMERIC
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Insert test data into carts table
INSERT INTO carts (user_id, created_at, updated_at, status) VALUES
    (uuid_generate_v4(), CURRENT_DATE, CURRENT_DATE, 'OPEN'),
    (uuid_generate_v4(), CURRENT_DATE, CURRENT_DATE, 'ORDERED');

-- Insert test data into cart_items table
INSERT INTO cart_items (cart_id, product_id, count) VALUES
    ((SELECT id FROM carts WHERE status = 'OPEN' LIMIT 1), uuid_generate_v4(), 2),
    ((SELECT id FROM carts WHERE status = 'OPEN' LIMIT 1), uuid_generate_v4(), 1);

-- Insert test data into orders table
INSERT INTO orders (user_id, cart_id, payment, delivery, comments, status, total) VALUES
    (uuid_generate_v4(), (SELECT id FROM carts WHERE status = 'ORDERED'), '{"method": "credit_card", "amount": 100.00}', '{"address": "123 Main St", "city": "Anytown"}', 'Leave at the door.', 'COMPLETED', 100.00);

-- Insert test data into users table
INSERT INTO users (name, email, created_at) VALUES
    ('John Doe', 'john.doe@example.com', CURRENT_DATE),
    ('Jane Smith', 'jane.smith@example.com', CURRENT_DATE);

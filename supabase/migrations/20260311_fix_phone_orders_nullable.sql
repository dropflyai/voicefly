-- Make customer_name and customer_phone nullable on phone_orders
-- Orders are created before the customer's name/phone is collected
ALTER TABLE phone_orders ALTER COLUMN customer_name DROP NOT NULL;
ALTER TABLE phone_orders ALTER COLUMN customer_phone DROP NOT NULL;

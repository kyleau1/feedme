-- Clear all previous orders from the database
-- WARNING: This will delete ALL orders permanently

-- Delete all orders
DELETE FROM orders;

-- Reset the sequence for orders table (if using auto-increment)
-- Note: This is for PostgreSQL. Adjust for your database if needed.
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;

-- Optional: Clear any related data
-- DELETE FROM order_items;
-- DELETE FROM order_customizations;

-- Show confirmation
SELECT 'All orders have been cleared from the database' as message;

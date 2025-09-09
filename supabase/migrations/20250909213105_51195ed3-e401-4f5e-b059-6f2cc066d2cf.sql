-- Add the "verified" status to the order_status enum
ALTER TYPE order_status ADD VALUE 'verified' AFTER 'verifying';
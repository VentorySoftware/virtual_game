-- Add timestamp columns for order status tracking
ALTER TABLE public.orders 
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
-- Drop the existing payment_method constraint if it exists
ALTER TABLE public.orders ALTER COLUMN payment_method TYPE TEXT;

-- Update the orders table to reference payment methods by code
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method_code TEXT;

-- Update existing records to use the new field
UPDATE public.orders SET payment_method_code = payment_method WHERE payment_method_code IS NULL;

-- Eventually we can drop the old payment_method column if needed, but for now keep both for compatibility
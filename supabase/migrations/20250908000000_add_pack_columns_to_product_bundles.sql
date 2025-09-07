-- Add missing columns to product_bundles for pack management
ALTER TABLE public.product_bundles
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

-- Update the bundle_price calculation to consider discount_percentage
-- This is optional, but if discount_percentage is used, we might want to adjust bundle_price accordingly
-- For now, we'll keep it as is, assuming discount_percentage is for display purposes

-- Add index for platform_id for better query performance
CREATE INDEX IF NOT EXISTS idx_product_bundles_platform_id ON public.product_bundles(platform_id);

-- Add index for valid_until for expiration queries
CREATE INDEX IF NOT EXISTS idx_product_bundles_valid_until ON public.product_bundles(valid_until);

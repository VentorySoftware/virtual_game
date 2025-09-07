
ALTER TABLE public.product_bundles
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_bundles_platform_id ON public.product_bundles(platform_id);


CREATE INDEX IF NOT EXISTS idx_product_bundles_valid_until ON public.product_bundles(valid_until);

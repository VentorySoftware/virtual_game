-- Modificar tabla product_reviews para permitir reseñas de la tienda
-- Hacer product_id nullable para permitir reseñas generales de la tienda
ALTER TABLE public.product_reviews ALTER COLUMN product_id DROP NOT NULL;

-- Agregar índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON public.product_reviews(is_approved);

-- Función para verificar si un usuario compró un producto específico
CREATE OR REPLACE FUNCTION public.user_purchased_product(user_id_param uuid, product_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = user_id_param 
        AND o.payment_status = 'paid'
        AND oi.product_id = product_id_param
    );
END;
$$;

-- Función para verificar si un usuario realizó alguna compra (para reseñas de tienda)
CREATE OR REPLACE FUNCTION public.user_has_purchases(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM orders
        WHERE user_id = user_id_param 
        AND payment_status = 'paid'
    );
END;
$$;

-- Actualizar policies para incluir las nuevas validaciones
DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;

CREATE POLICY "Users can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND (
        -- Para reseñas de productos: debe haber comprado el producto
        (product_id IS NOT NULL AND public.user_purchased_product(auth.uid(), product_id)) OR
        -- Para reseñas de tienda: debe haber realizado al menos una compra
        (product_id IS NULL AND public.user_has_purchases(auth.uid()))
    )
);

-- Policy para que usuarios solo puedan tener una reseña por producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_product_review 
ON public.product_reviews(user_id, product_id) 
WHERE product_id IS NOT NULL;

-- Índice único para reseñas de tienda (una por usuario)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_store_review 
ON public.product_reviews(user_id) 
WHERE product_id IS NULL;
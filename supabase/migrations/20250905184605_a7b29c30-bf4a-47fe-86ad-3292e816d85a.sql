-- Create table for payment methods configuration
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  icon_name TEXT,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Payment methods are publicly readable when active" 
ON public.payment_methods 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage payment methods" 
ON public.payment_methods 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, code, description, is_active, display_order, icon_name, configuration) VALUES
('Transferencia Bancaria', 'bank_transfer', 'Pago manual mediante transferencia bancaria con confirmación vía WhatsApp', true, 1, 'Building2', '{"requires_confirmation": true, "whatsapp_notification": true}'),
('MercadoPago', 'mercadopago', 'Pago inmediato con tarjeta de crédito, débito o transferencia a través de MercadoPago', true, 2, 'CreditCard', '{"supports_installments": true, "instant_confirmation": true}');

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
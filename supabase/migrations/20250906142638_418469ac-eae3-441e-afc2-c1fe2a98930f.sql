-- Create business_hours table
CREATE TABLE public.business_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_type text NOT NULL,
  time_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(day_type)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business hours are publicly readable" 
ON public.business_hours 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage business hours" 
ON public.business_hours 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business hours
INSERT INTO public.business_hours (day_type, time_slots, is_closed) VALUES
('lunes a viernes', '[{"start": "09:00", "end": "18:00"}]', false),
('sabados', '[{"start": "09:00", "end": "14:00"}]', false),
('domingo', '[]', true),
('feriados', '[]', true)
ON CONFLICT (day_type) DO NOTHING;
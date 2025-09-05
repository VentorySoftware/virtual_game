-- Migration to create business_hours table for managing customer service hours

CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_type text NOT NULL, -- e.g. 'lunes a viernes', 'sabados', 'domingo', 'feriados'
  time_slots jsonb NOT NULL, -- array of time slots [{start: '08:00', end: '12:00'}, ...]
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for day_type for faster queries
CREATE INDEX IF NOT EXISTS idx_business_hours_day_type ON public.business_hours(day_type);

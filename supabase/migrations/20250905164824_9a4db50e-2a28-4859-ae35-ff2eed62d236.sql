-- Asignar rol de administrador al usuario existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('367aa2b3-3fde-47df-abfc-2737929a5235', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
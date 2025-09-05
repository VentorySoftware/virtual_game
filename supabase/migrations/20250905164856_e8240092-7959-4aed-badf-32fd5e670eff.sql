-- Crear políticas RLS para la tabla user_roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Solo los administradores pueden ver los roles de usuarios
CREATE POLICY "Admins can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));
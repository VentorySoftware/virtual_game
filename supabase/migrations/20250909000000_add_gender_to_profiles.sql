-- Create gender enum type
CREATE TYPE public.user_gender AS ENUM ('Hombre', 'Mujer', 'Otro / No binario', 'Prefiero no decirlo');

-- Add gender column to profiles table
ALTER TABLE public.profiles ADD COLUMN gender user_gender;

-- Update existing records to have a default gender
UPDATE public.profiles SET gender = 'Prefiero no decirlo' WHERE gender IS NULL;

-- Make gender column NOT NULL after updating existing records
ALTER TABLE public.profiles ALTER COLUMN gender SET NOT NULL;

-- Update the handle_new_user function to include gender
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
AS $$
BEGIN
    -- Insertar el perfil del usuario
    INSERT INTO public.profiles (user_id, email, first_name, last_name, gender)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        (NEW.raw_user_meta_data ->> 'gender')::user_gender
    );

    -- Asignar automáticamente el rol de 'user' (cliente)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

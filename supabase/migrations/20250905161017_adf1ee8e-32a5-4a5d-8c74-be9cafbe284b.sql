-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.order_status AS ENUM ('draft', 'paid', 'verifying', 'delivered', 'cancelled');
CREATE TYPE public.product_type AS ENUM ('digital', 'physical', 'preorder', 'bundle');
CREATE TYPE public.user_role AS ENUM ('admin', 'catalog_manager', 'content_manager', 'support', 'marketing', 'reports');
CREATE TYPE public.payment_method AS ENUM ('mercadopago', 'paypal', 'bank_transfer');
CREATE TYPE public.platform_type AS ENUM ('PC', 'PS5', 'PS4', 'PS3', 'Xbox Series', 'Xbox One', 'Xbox 360', 'Nintendo Switch', 'Nintendo 3DS', 'Mobile');

-- Profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platforms table
CREATE TABLE public.platforms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type platform_type NOT NULL,
    icon_url TEXT,
    color TEXT DEFAULT '#FF006E',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE,
    original_price DECIMAL(10,2),
    price DECIMAL(10,2) NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    type product_type DEFAULT 'digital',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    digital_content TEXT,
    release_date TIMESTAMP WITH TIME ZONE,
    preorder_date TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(2,1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    image_url TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    platform_id UUID REFERENCES public.platforms(id) ON DELETE SET NULL,
    seo_title TEXT,
    seo_description TEXT,
    meta_keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product bundles/packs
CREATE TABLE public.product_bundles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    bundle_price DECIMAL(10,2) NOT NULL,
    original_total DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    badge_text TEXT DEFAULT 'Combo Especial',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bundle items
CREATE TABLE public.bundle_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(bundle_id, product_id)
);

-- Shopping cart
CREATE TABLE public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES public.product_bundles(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK ((product_id IS NOT NULL AND bundle_id IS NULL) OR (product_id IS NULL AND bundle_id IS NOT NULL))
);

-- Coupons
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status order_status DEFAULT 'draft',
    payment_method payment_method,
    payment_status TEXT DEFAULT 'pending',
    payment_id TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    coupon_code TEXT,
    customer_notes TEXT,
    admin_notes TEXT,
    delivery_evidence JSONB DEFAULT '[]'::jsonb,
    billing_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    bundle_id UUID REFERENCES public.product_bundles(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    digital_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK ((product_id IS NOT NULL AND bundle_id IS NULL) OR (product_id IS NULL AND bundle_id IS NOT NULL))
);

-- Product reviews
CREATE TABLE public.product_reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Blog posts
CREATE TABLE public.blog_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    seo_title TEXT,
    seo_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Blog comments
CREATE TABLE public.blog_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CMS Pages
CREATE TABLE public.cms_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Site settings
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Banners for home page
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    button_text TEXT,
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Roulette prizes for coupon wheel
CREATE TABLE public.roulette_prizes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    coupon_code TEXT REFERENCES public.coupons(code) ON DELETE CASCADE,
    probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roulette attempts (fixed the unique constraint issue)
CREATE TABLE public.user_roulette_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prize_id UUID REFERENCES public.roulette_prizes(id) ON DELETE SET NULL,
    coupon_won TEXT,
    attempt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, attempt_date)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('products', 'products', true),
('banners', 'banners', true),
('blog', 'blog', true),
('avatars', 'avatars', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roulette_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roulette_attempts ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

-- Categories policies - public read, admin write
CREATE POLICY "Categories are publicly readable" ON public.categories
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (public.is_admin(auth.uid()));

-- Platforms policies - public read, admin write
CREATE POLICY "Platforms are publicly readable" ON public.platforms
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage platforms" ON public.platforms
FOR ALL USING (public.is_admin(auth.uid()));

-- Products policies - public read, admin write
CREATE POLICY "Products are publicly readable" ON public.products
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage products" ON public.products
FOR ALL USING (public.is_admin(auth.uid()));

-- Product bundles policies
CREATE POLICY "Bundles are publicly readable" ON public.product_bundles
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage bundles" ON public.product_bundles
FOR ALL USING (public.is_admin(auth.uid()));

-- Bundle items policies
CREATE POLICY "Bundle items are publicly readable" ON public.bundle_items
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage bundle items" ON public.bundle_items
FOR ALL USING (public.is_admin(auth.uid()));

-- Cart items policies
CREATE POLICY "Users can manage their cart" ON public.cart_items
FOR ALL USING (auth.uid() = user_id);

-- Coupons policies
CREATE POLICY "Active coupons are readable" ON public.coupons
FOR SELECT TO authenticated USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage coupons" ON public.coupons
FOR ALL USING (public.is_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Users can view their orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their draft orders" ON public.orders
FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Admins can manage all orders" ON public.orders
FOR ALL USING (public.is_admin(auth.uid()));

-- Order items policies
CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_items.order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage order items" ON public.order_items
FOR ALL USING (public.is_admin(auth.uid()));

-- Reviews policies
CREATE POLICY "Approved reviews are publicly readable" ON public.product_reviews
FOR SELECT TO authenticated, anon USING (is_approved = true);

CREATE POLICY "Users can create reviews" ON public.product_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.product_reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.product_reviews
FOR ALL USING (public.is_admin(auth.uid()));

-- Blog posts policies
CREATE POLICY "Published posts are publicly readable" ON public.blog_posts
FOR SELECT TO authenticated, anon USING (is_published = true);

CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
FOR ALL USING (public.is_admin(auth.uid()));

-- Blog comments policies
CREATE POLICY "Approved comments are publicly readable" ON public.blog_comments
FOR SELECT TO authenticated, anon USING (is_approved = true);

CREATE POLICY "Users can create comments" ON public.blog_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments" ON public.blog_comments
FOR ALL USING (public.is_admin(auth.uid()));

-- CMS pages policies
CREATE POLICY "Active pages are publicly readable" ON public.cms_pages
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage CMS pages" ON public.cms_pages
FOR ALL USING (public.is_admin(auth.uid()));

-- Site settings policies
CREATE POLICY "Settings are publicly readable" ON public.site_settings
FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
FOR ALL USING (public.is_admin(auth.uid()));

-- Banners policies
CREATE POLICY "Active banners are publicly readable" ON public.banners
FOR SELECT TO authenticated, anon USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banners
FOR ALL USING (public.is_admin(auth.uid()));

-- Roulette policies
CREATE POLICY "Active prizes are readable" ON public.roulette_prizes
FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage roulette prizes" ON public.roulette_prizes
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their attempts" ON public.user_roulette_attempts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts" ON public.user_roulette_attempts
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage policies for public buckets
CREATE POLICY "Public read access for products" ON storage.objects
FOR SELECT TO authenticated, anon USING (bucket_id = 'products');

CREATE POLICY "Public read access for banners" ON storage.objects
FOR SELECT TO authenticated, anon USING (bucket_id = 'banners');

CREATE POLICY "Public read access for blog" ON storage.objects
FOR SELECT TO authenticated, anon USING (bucket_id = 'blog');

CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT TO authenticated, anon USING (bucket_id = 'avatars');

CREATE POLICY "Admins can upload to products" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload to banners" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload to blog" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'blog' AND public.is_admin(auth.uid()));

CREATE POLICY "Users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bundles_updated_at BEFORE UPDATE ON public.product_bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$;

-- Trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'VG' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM now())::text, 6, '0');
    RETURN order_num;
END;
$$;

-- Function to update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.products 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1)
            FROM public.product_reviews 
            WHERE product_id = NEW.product_id AND is_approved = true
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.product_reviews 
            WHERE product_id = NEW.product_id AND is_approved = true
        )
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

-- Trigger to update product rating when review is approved
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OF is_approved ON public.product_reviews
    FOR EACH ROW 
    WHEN (NEW.is_approved = true)
    EXECUTE FUNCTION public.update_product_rating();
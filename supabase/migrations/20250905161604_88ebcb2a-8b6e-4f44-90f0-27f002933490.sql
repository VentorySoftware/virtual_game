-- Fix function search paths
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    order_num TEXT;
BEGIN
    order_num := 'VG' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM now())::text, 6, '0');
    RETURN order_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Insert seed data

-- Insert platforms
INSERT INTO public.platforms (name, slug, type, color, sort_order) VALUES
('PC', 'pc', 'PC', '#FF006E', 1),
('PlayStation 5', 'ps5', 'PS5', '#00F5D4', 2),
('PlayStation 4', 'ps4', 'PS4', '#0070F3', 3),
('PlayStation 3', 'ps3', 'PS3', '#0070F3', 4),
('Xbox Series X/S', 'xbox-series', 'Xbox Series', '#107C10', 5),
('Xbox One', 'xbox-one', 'Xbox One', '#107C10', 6),
('Xbox 360', 'xbox-360', 'Xbox 360', '#107C10', 7),
('Nintendo Switch', 'nintendo-switch', 'Nintendo Switch', '#E60012', 8);

-- Insert categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
('Acción', 'accion', 'Juegos de acción y aventura', 1),
('Aventura', 'aventura', 'Juegos de aventura épicos', 2),
('RPG', 'rpg', 'Juegos de rol inmersivos', 3),
('Deportes', 'deportes', 'Simuladores deportivos', 4),
('Racing', 'racing', 'Juegos de carreras', 5),
('Shooter', 'shooter', 'Juegos de disparos', 6),
('Estrategia', 'estrategia', 'Juegos de estrategia', 7),
('Horror', 'horror', 'Juegos de terror', 8),
('Indie', 'indie', 'Juegos independientes', 9),
('Retro', 'retro', 'Clásicos atemporales', 10);

-- Insert sample products for PC
INSERT INTO public.products (title, slug, description, short_description, sku, original_price, price, discount_percentage, type, is_active, is_featured, stock_quantity, rating, total_reviews, image_url, category_id, platform_id, seo_title, seo_description) VALUES
('Cyberpunk 2077: Phantom Liberty', 'cyberpunk-2077-phantom-liberty', 'La expansión definitiva de Cyberpunk 2077 te lleva a una nueva aventura en Night City con Keanu Reeves.', 'Expansión épica de Cyberpunk 2077', 'CP77PL001', 25999.00, 15999.00, 38, 'digital', true, true, 100, 4.8, 245, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'accion' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Cyberpunk 2077: Phantom Liberty - Virtual Game', 'Compra Cyberpunk 2077: Phantom Liberty digital para PC al mejor precio'),

('Baldur''s Gate 3', 'baldurs-gate-3', 'El RPG definitivo que redefine el género con decisiones épicas y combate táctico por turnos.', 'RPG épico de fantasía', 'BG3001', 32999.00, 29999.00, 9, 'digital', true, true, 50, 4.9, 1823, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'rpg' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Baldur''s Gate 3 - RPG Definitivo', 'Baldur''s Gate 3 digital para PC - El mejor RPG del año'),

('Starfield', 'starfield', 'Explora el universo en esta épica aventura espacial de Bethesda con más de 1000 planetas por descubrir.', 'Aventura espacial épica', 'SF001', 35999.00, 32999.00, 8, 'digital', true, false, 75, 4.5, 987, 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Starfield PC - Aventura Espacial', 'Starfield digital para PC - Explora el universo'),

('Call of Duty: Modern Warfare III', 'cod-modern-warfare-3', 'La última entrega de la saga COD con multijugador renovado y campaña emocionante.', 'Shooter militar premium', 'CODMW3001', 38999.00, 34999.00, 10, 'digital', true, false, 200, 4.3, 567, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'shooter' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Call of Duty: Modern Warfare III PC', 'COD Modern Warfare III digital para PC'),

('Hogwarts Legacy', 'hogwarts-legacy', 'Vive tu propia aventura mágica en el mundo de Harry Potter como nunca antes.', 'RPG mágico de Harry Potter', 'HL001', 32999.00, 27999.00, 15, 'digital', true, true, 150, 4.7, 1234, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'rpg' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Hogwarts Legacy PC - Magia Digital', 'Hogwarts Legacy para PC - Aventura mágica'),

('Elden Ring', 'elden-ring', 'El aclamado RPG de FromSoftware que combina exploración épica con combate desafiante.', 'RPG épico de FromSoftware', 'ER001', 29999.00, 24999.00, 17, 'digital', true, false, 80, 4.8, 2145, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'rpg' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Elden Ring PC Digital', 'Elden Ring para PC - RPG épico'),

('FIFA 24', 'fifa-24', 'La simulación de fútbol más realista con tecnología HyperMotionV y modos de juego renovados.', 'Simulador de fútbol premium', 'FIFA24001', 32999.00, 28999.00, 12, 'digital', true, false, 300, 4.2, 789, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'deportes' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'FIFA 24 PC Digital', 'FIFA 24 para PC - Fútbol realista'),

('The Witcher 3: Wild Hunt GOTY', 'witcher-3-goty', 'La edición completa del aclamado RPG con todas las expansiones incluidas.', 'RPG completo con DLCs', 'W3GOTY001', 19999.00, 12999.00, 35, 'digital', true, true, 500, 4.9, 3567, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'rpg' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'The Witcher 3 GOTY PC', 'The Witcher 3 Game of the Year para PC'),

-- Add more PC products
('Microsoft Flight Simulator', 'microsoft-flight-simulator', 'La experiencia de vuelo más realista del mundo con paisajes fotorrealistas.', 'Simulador de vuelo definitivo', 'MSFS001', 28999.00, 22999.00, 21, 'digital', true, false, 120, 4.6, 456, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'estrategia' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Microsoft Flight Simulator PC', 'Microsoft Flight Simulator para PC'),

('Red Dead Redemption 2', 'red-dead-redemption-2', 'Épica aventura del Salvaje Oeste con una historia inmersiva y mundo abierto.', 'Western épico de Rockstar', 'RDR2001', 35999.00, 26999.00, 25, 'digital', true, true, 200, 4.7, 1567, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Red Dead Redemption 2 PC', 'Red Dead Redemption 2 para PC'),

('Age of Empires IV', 'age-of-empires-4', 'El regreso de la legendaria saga de estrategia en tiempo real.', 'RTS legendario renovado', 'AOE4001', 24999.00, 19999.00, 20, 'digital', true, false, 150, 4.4, 678, 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'estrategia' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Age of Empires IV PC', 'Age of Empires IV para PC'),

('Forza Horizon 5', 'forza-horizon-5', 'Carreras en mundo abierto en los paisajes de México con gráficos impresionantes.', 'Racing arcade premium', 'FH5001', 32999.00, 24999.00, 24, 'digital', true, false, 180, 4.5, 892, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'racing' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Forza Horizon 5 PC', 'Forza Horizon 5 para PC'),

('Resident Evil 4 Remake', 'resident-evil-4-remake', 'El clásico del survival horror reinventado con gráficos de nueva generación.', 'Horror clásico renovado', 'RE4R001', 31999.00, 26999.00, 16, 'digital', true, true, 100, 4.8, 1234, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'horror' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Resident Evil 4 Remake PC', 'Resident Evil 4 Remake para PC'),

('Hades', 'hades', 'Roguelike indie aclamado con narrativa excepcional y combate adictivo.', 'Indie roguelike premium', 'HADES001', 15999.00, 11999.00, 25, 'digital', true, false, 300, 4.9, 2456, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'indie' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Hades PC Digital', 'Hades para PC - Indie Game'),

('Doom Eternal', 'doom-eternal', 'El shooter más intenso y frenético con demonios y acción sin parar.', 'Shooter intenso y brutal', 'DOOM001', 25999.00, 18999.00, 27, 'digital', true, false, 250, 4.6, 1098, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'shooter' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Doom Eternal PC', 'Doom Eternal para PC'),

('Portal 2', 'portal-2', 'El puzzle game clásico que redefinió el género con su humor y mecánicas únicas.', 'Puzzle clásico atemporal', 'PORTAL2001', 8999.00, 5999.00, 33, 'digital', true, false, 500, 4.9, 3456, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'retro' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Portal 2 PC Retro', 'Portal 2 para PC - Clásico gaming'),

('Among Us', 'among-us', 'El juego multijugador indie que conquistó al mundo con su simplicidad adictiva.', 'Multijugador indie viral', 'AMONG001', 1999.00, 999.00, 50, 'digital', true, false, 1000, 4.3, 5678, 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'indie' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Among Us PC', 'Among Us para PC'),

('Counter-Strike 2', 'counter-strike-2', 'La evolución del FPS competitivo más popular del mundo.', 'FPS competitivo definitivo', 'CS2001', 0.00, 0.00, 0, 'digital', true, true, 9999, 4.7, 8901, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'shooter' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Counter-Strike 2 PC Free', 'Counter-Strike 2 gratis para PC'),

('Minecraft', 'minecraft-java', 'El sandbox definitivo donde tu creatividad es el único límite.', 'Sandbox creativo infinito', 'MC001', 12999.00, 12999.00, 0, 'digital', true, true, 9999, 4.8, 9999, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'indie' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'pc' LIMIT 1), 'Minecraft Java Edition PC', 'Minecraft Java para PC');

-- Insert PS5 products
INSERT INTO public.products (title, slug, description, short_description, sku, original_price, price, discount_percentage, type, is_active, is_featured, stock_quantity, rating, total_reviews, image_url, category_id, platform_id, seo_title, seo_description) VALUES
('Spider-Man 2', 'spider-man-2-ps5', 'Juega como Peter Parker y Miles Morales en esta secuela épica exclusiva de PS5.', 'Aventura de superhéroes exclusiva', 'SM2PS5001', 38999.00, 35999.00, 8, 'preorder', true, true, 0, 4.9, 156, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'accion' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Spider-Man 2 PS5 - Pre-orden', 'Spider-Man 2 para PS5 - Aventura de superhéroes'),

('God of War Ragnarök', 'god-of-war-ragnarok-ps5', 'La épica conclusión de la saga nórdica de Kratos y Atreus en PS5.', 'Aventura mitológica épica', 'GORPS5001', 35999.00, 31999.00, 11, 'digital', true, true, 120, 4.8, 2341, 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'God of War Ragnarök PS5', 'God of War Ragnarök para PS5 - Épica aventura'),

('Horizon Forbidden West', 'horizon-forbidden-west-ps5', 'Continúa la aventura de Aloy en un mundo postapocalíptico lleno de máquinas.', 'Aventura postapocalíptica', 'HFWPS5001', 32999.00, 27999.00, 15, 'digital', true, false, 200, 4.7, 1876, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Horizon Forbidden West PS5', 'Horizon Forbidden West para PS5'),

('Gran Turismo 7', 'gran-turismo-7-ps5', 'El simulador de carreras definitivo con gráficos de nueva generación.', 'Simulador de carreras premium', 'GT7PS5001', 35999.00, 32999.00, 8, 'digital', true, false, 150, 4.6, 943, 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'racing' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Gran Turismo 7 PS5', 'Gran Turismo 7 para PS5 - Carreras realistas'),

-- More PS5 games
('The Last of Us Part I', 'the-last-of-us-part-1-ps5', 'El remake definitivo del clásico post-apocalíptico de Naughty Dog.', 'Supervivencia post-apocalíptica', 'TLOU1PS5001', 38999.00, 28999.00, 26, 'digital', true, true, 100, 4.8, 1567, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'The Last of Us Part I PS5', 'The Last of Us Part I para PS5'),

('Demon''s Souls', 'demons-souls-ps5', 'El souls-like original renovado con gráficos impresionantes para PS5.', 'Souls-like definitivo', 'DSPS5001', 35999.00, 24999.00, 31, 'digital', true, false, 80, 4.7, 987, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'rpg' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Demon''s Souls PS5', 'Demon''s Souls para PS5'),

('Ratchet & Clank: Rift Apart', 'ratchet-clank-rift-apart-ps5', 'Aventura interdimensional que aprovecha al máximo las capacidades de PS5.', 'Aventura interdimensional', 'RCRAPS5001', 32999.00, 22999.00, 30, 'digital', true, false, 150, 4.6, 789, 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Ratchet & Clank Rift Apart PS5', 'Ratchet & Clank Rift Apart para PS5'),

('Ghost of Tsushima Director''s Cut', 'ghost-of-tsushima-dc-ps5', 'La experiencia samurái definitiva con la expansión Iki Island incluida.', 'Aventura samurái épica', 'GOTDCPS5001', 35999.00, 26999.00, 25, 'digital', true, true, 120, 4.8, 1456, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop', (SELECT id FROM public.categories WHERE slug = 'aventura' LIMIT 1), (SELECT id FROM public.platforms WHERE slug = 'ps5' LIMIT 1), 'Ghost of Tsushima DC PS5', 'Ghost of Tsushima Director''s Cut para PS5');

-- Set preorder date for Spider-Man 2
UPDATE public.products SET preorder_date = '2024-10-20T00:00:00Z' WHERE slug = 'spider-man-2-ps5';

-- Insert coupons for roulette
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_amount, usage_limit, is_active, expires_at) VALUES
('WELCOME10', '10% de descuento en tu primera compra', 'percentage', 10.00, 5000.00, 100, true, '2024-12-31T23:59:59Z'),
('GAMER15', '15% de descuento en juegos seleccionados', 'percentage', 15.00, 10000.00, 50, true, '2024-12-31T23:59:59Z'),
('SAVE500', '$500 de descuento', 'fixed', 500.00, 15000.00, 30, true, '2024-12-31T23:59:59Z'),
('MEGA20', '20% de descuento mega oferta', 'percentage', 20.00, 20000.00, 20, true, '2024-12-31T23:59:59Z'),
('BONUS300', '$300 de descuento bonus', 'fixed', 300.00, 8000.00, 75, true, '2024-12-31T23:59:59Z');

-- Insert roulette prizes
INSERT INTO public.roulette_prizes (name, coupon_code, probability, is_active) VALUES
('10% Descuento', 'WELCOME10', 30.00, true),
('15% Descuento', 'GAMER15', 25.00, true),
('$500 Descuento', 'SAVE500', 15.00, true),
('20% Mega Descuento', 'MEGA20', 10.00, true),
('$300 Bonus', 'BONUS300', 20.00, true);

-- Insert banners
INSERT INTO public.banners (title, subtitle, image_url, link_url, button_text, position, is_active) VALUES
('Ofertas Cyberpunk', 'Hasta 40% OFF en toda la saga', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop', '#', 'Ver Ofertas', 1, true),
('Pre-órdenes Abiertas', 'Asegura los próximos lanzamientos', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop', '#', 'Pre-ordenar', 2, true),
('Packs Exclusivos', 'Combos especiales con descuentos únicos', 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&h=400&fit=crop', '#', 'Ver Packs', 3, true);

-- Insert blog posts (without author_id to avoid foreign key issues)
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image, is_published, is_featured, tags, seo_title, seo_description, published_at) VALUES
('Los 10 Mejores Juegos de 2024', 'mejores-juegos-2024', 'Descubre cuáles fueron los títulos que marcaron este año en el gaming', 'Este año ha sido excepcional para los videojuegos, con lanzamientos que han redefinido géneros completos. Desde RPGs épicos hasta aventuras indie innovadoras, 2024 nos ha dado experiencias inolvidables...', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop', true, true, ARRAY['gaming', '2024', 'top10'], 'Los 10 Mejores Juegos de 2024 - Virtual Game Blog', 'Conoce los mejores videojuegos del año 2024', now() - INTERVAL '1 week'),

('Guía Completa: Cyberpunk 2077 Phantom Liberty', 'guia-cyberpunk-phantom-liberty', 'Todo lo que necesitas saber sobre la nueva expansión', 'Phantom Liberty no es solo una expansión, es una reinvención completa de Cyberpunk 2077. Con nuevas mecánicas, historia épica y el regreso de Keanu Reeves...', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop', true, false, ARRAY['cyberpunk', 'guia', 'expansion'], 'Guía Cyberpunk 2077 Phantom Liberty - Virtual Game', 'Guía completa de Phantom Liberty expansión', now() - INTERVAL '3 days'),

('El Futuro del Gaming: Tendencias 2025', 'futuro-gaming-2025', 'Qué esperar del próximo año en videojuegos', 'El 2025 promete ser un año revolucionario para la industria del gaming. Con nuevas tecnologías, IPs renovadas y enfoques innovadores...', 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=400&fit=crop', true, true, ARRAY['futuro', 'tendencias', '2025'], 'Futuro del Gaming 2025 - Tendencias y Predicciones', 'Descubre las tendencias del gaming para 2025', now() - INTERVAL '1 day');

-- Insert CMS pages
INSERT INTO public.cms_pages (title, slug, content, is_active, seo_title, seo_description) VALUES
('Preguntas Frecuentes', 'faqs', '<h2>Preguntas Frecuentes</h2><h3>¿Cómo funciona la entrega digital?</h3><p>Todos nuestros juegos se entregan de forma instantánea mediante códigos de activación o cuentas digitales.</p><h3>¿Qué métodos de pago aceptan?</h3><p>Aceptamos Mercado Pago, PayPal y transferencias bancarias.</p><h3>¿Puedo cancelar mi pedido?</h3><p>Los pedidos pueden cancelarse antes de la entrega del contenido digital.</p>', true, 'Preguntas Frecuentes - Virtual Game', 'Resuelve todas tus dudas sobre Virtual Game'),

('Medios de Pago', 'medios-de-pago', '<h2>Medios de Pago Disponibles</h2><p>En Virtual Game aceptamos los siguientes métodos de pago:</p><ul><li>Mercado Pago (tarjetas, Pago Fácil, Rapipago)</li><li>PayPal</li><li>Transferencia bancaria</li></ul><p>Todos los pagos son procesados de forma segura.</p>', true, 'Medios de Pago - Virtual Game', 'Conoce todos los métodos de pago disponibles'),

('Términos y Condiciones', 'terminos-y-condiciones', '<h2>Términos y Condiciones de Uso</h2><p>Al utilizar Virtual Game, aceptas los siguientes términos...</p><p>1. Los productos digitales no pueden ser devueltos una vez entregados.</p><p>2. Nos reservamos el derecho de cancelar órdenes sospechosas.</p><p>3. Los precios pueden cambiar sin previo aviso.</p>', true, 'Términos y Condiciones - Virtual Game', 'Lee nuestros términos y condiciones de uso');

-- Insert site settings
INSERT INTO public.site_settings (key, value, description) VALUES
('site_name', '"Virtual Game"', 'Nombre del sitio web'),
('site_description', '"Tu tienda online de juegos digitales con los mejores precios"', 'Descripción del sitio'),
('contact_email', '"contacto@virtualgame.com"', 'Email de contacto'),
('contact_phone', '"+54 11 1234-5678"', 'Teléfono de contacto'),
('whatsapp_number', '"+5411123456789"', 'Número de WhatsApp'),
('business_hours', '"Lunes a Viernes: 9:00 - 18:00 | Sábados: 9:00 - 13:00"', 'Horarios de atención'),
('currency', '"ARS"', 'Moneda por defecto'),
('primary_color', '"#FF006E"', 'Color primario del tema'),
('secondary_color', '"#00F5D4"', 'Color secundario del tema'),
('accent_color', '"#FFD60A"', 'Color de acento del tema'),
('benefits', '[{"title": "Entrega Inmediata", "description": "Recibe tu juego al instante", "icon": "zap"}, {"title": "Garantía Total", "description": "100% de satisfacción garantizada", "icon": "shield"}, {"title": "Soporte 24/7", "description": "Asistencia cuando la necesites", "icon": "headphones"}]', 'Beneficios del sitio');

-- Create bundles
INSERT INTO public.product_bundles (name, description, bundle_price, original_total, badge_text) VALUES
('Pack Gamer Ultimate', 'Los mejores juegos del año en un solo pack con descuento especial', 89999.00, 120999.00, 'Mega Pack'),
('Pack RPG Legendario', 'Los mejores RPGs en un solo combo épico', 69999.00, 89999.00, 'RPG Pack'),
('Pack Shooter Pro', 'Acción y adrenalina en este pack de disparos', 79999.00, 98999.00, 'Action Pack');

-- Add products to bundles
INSERT INTO public.bundle_items (bundle_id, product_id, quantity) VALUES
((SELECT id FROM public.product_bundles WHERE name = 'Pack Gamer Ultimate' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'cyberpunk-2077-phantom-liberty' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack Gamer Ultimate' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'baldurs-gate-3' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack Gamer Ultimate' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'elden-ring' LIMIT 1), 1),

((SELECT id FROM public.product_bundles WHERE name = 'Pack RPG Legendario' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'baldurs-gate-3' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack RPG Legendario' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'elden-ring' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack RPG Legendario' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'witcher-3-goty' LIMIT 1), 1),

((SELECT id FROM public.product_bundles WHERE name = 'Pack Shooter Pro' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'cod-modern-warfare-3' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack Shooter Pro' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'doom-eternal' LIMIT 1), 1),
((SELECT id FROM public.product_bundles WHERE name = 'Pack Shooter Pro' LIMIT 1), (SELECT id FROM public.products WHERE slug = 'counter-strike-2' LIMIT 1), 1);
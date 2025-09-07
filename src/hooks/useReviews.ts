import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Review {
  id: string;
  product_id: string | null;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
  products?: {
    title: string;
    slug: string;
  };
}

export const useReviews = (productId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('product_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      } else {
        // Para reseñas de la tienda
        query = query.is('product_id', null);
      }

      const { data: reviewsData, error } = await query;

      if (error) throw error;

      // Obtener información de usuarios y productos por separado
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const productIds = [...new Set(reviewsData.filter(r => r.product_id).map(r => r.product_id))];

        // Obtener perfiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        // Obtener productos si existen
        let products: any[] = [];
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('products')
            .select('id, title, slug')
            .in('id', productIds);
          products = productsData || [];
        }

        // Combinar datos
        const enrichedReviews = reviewsData.map(review => ({
          ...review,
          profiles: profiles?.find(p => p.user_id === review.user_id) || null,
          products: products.find(p => p.id === review.product_id) || null
        }));

        setReviews(enrichedReviews);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las reseñas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [productId, toast]);

  const fetchUserReview = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', user.id);

      if (productId) {
        query = query.eq('product_id', productId);
      } else {
        query = query.is('product_id', null);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserReview(data || null);
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  }, [user, productId]);

  useEffect(() => {
    fetchReviews();
    fetchUserReview();
  }, [fetchReviews, fetchUserReview]);

  const submitReview = async (rating: number, title: string, content: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para dejar una reseña",
        variant: "destructive",
      });
      return false;
    }

    try {
      const reviewData = {
        user_id: user.id,
        product_id: productId || null,
        rating,
        title: title || null,
        content: content || null,
        is_approved: true, // Por defecto aprobado
      };

      let result;
      if (userReview) {
        // Actualizar reseña existente
        result = await supabase
          .from('product_reviews')
          .update(reviewData)
          .eq('id', userReview.id)
          .select()
          .single();
      } else {
        // Crear nueva reseña
        result = await supabase
          .from('product_reviews')
          .insert(reviewData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: "¡Éxito!",
        description: userReview ? "Reseña actualizada correctamente" : "Reseña enviada correctamente",
      });

      await fetchReviews();
      await fetchUserReview();
      return true;
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      if (error.message?.includes('user_purchased_product')) {
        toast({
          title: "Error",
          description: "Solo puedes reseñar productos que hayas comprado",
          variant: "destructive",
        });
      } else if (error.message?.includes('user_has_purchases')) {
        toast({
          title: "Error", 
          description: "Debes haber realizado al menos una compra para reseñar la tienda",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar la reseña. Intenta nuevamente.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const canUserReview = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      if (productId) {
        // Verificar si compró el producto
        const { data } = await supabase.rpc('user_purchased_product', {
          user_id_param: user.id,
          product_id_param: productId
        });
        return data || false;
      } else {
        // Verificar si tiene compras para reseñar la tienda
        const { data } = await supabase.rpc('user_has_purchases', {
          user_id_param: user.id
        });
        return data || false;
      }
    } catch (error) {
      console.error('Error checking review permission:', error);
      return false;
    }
  }, [user, productId]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

  return {
    reviews,
    loading,
    userReview,
    submitReview,
    canUserReview,
    averageRating: calculateAverageRating(),
    totalReviews: reviews.length,
    refetch: fetchReviews,
  };
};
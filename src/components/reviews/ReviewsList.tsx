import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import StarRating from './StarRating';
import { useReviews } from '@/hooks/useReviews';
import { Loader2, MessageSquare, Star } from 'lucide-react';

interface ReviewsListProps {
  productId?: string;
  productTitle?: string;
  showForm?: boolean;
  title?: string;
}

const ReviewsList = ({ 
  productId, 
  productTitle, 
  showForm = true,
  title 
}: ReviewsListProps) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { reviews, loading, averageRating, totalReviews, refetch } = useReviews(productId);

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const getReviewsTitle = () => {
    if (title) return title;
    return productId ? 'Reseñas del Producto' : 'Reseñas de la Tienda';
  };

  if (loading) {
    return (
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando reseñas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario de reseña */}
      {showForm && (
        <ReviewForm 
          productId={productId}
          productTitle={productTitle}
          onSubmitSuccess={() => refetch()}
        />
      )}

      {/* Estadísticas de reseñas */}
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {getReviewsTitle()}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {totalReviews > 0 ? (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                {productId 
                  ? "Este producto aún no tiene reseñas"
                  : "La tienda aún no tiene reseñas"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de reseñas */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showProduct={!productId} // Mostrar producto solo en reseñas de tienda
            />
          ))}

          {reviews.length > 3 && (
            <>
              <Separator className="my-6" />
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="cyber-button"
                >
                  {showAllReviews 
                    ? 'Mostrar menos' 
                    : `Ver todas las reseñas (${reviews.length})`
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { Review } from '@/hooks/useReviews';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
  showProduct?: boolean;
}

const ReviewCard = ({ review, showProduct = false }: ReviewCardProps) => {
  const navigate = useNavigate();

  const getUserInitials = () => {
    const firstName = review.profiles?.first_name || '';
    const lastName = review.profiles?.last_name || '';

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    } else if (firstName) {
      return firstName[0];
    }
    return 'U';
  };

  const getUserName = () => {
    const firstName = review.profiles?.first_name || '';
    const lastName = review.profiles?.last_name || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    }
    return 'Usuario Anónimo';
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    });
  };

  const handleProductClick = () => {
    if (review.products?.slug) {
      navigate(`/producto/${review.products.slug}`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cyber-border bg-card/50 backdrop-blur-sm cursor-pointer hover:bg-card/70 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-foreground">{getUserName()}</h4>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              {showProduct && review.products && (
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">
                    {review.products.title}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>

          {(review.title || review.content) && (
            <CardContent className="pt-0">
              {review.title && (
                <h5 className="font-medium text-foreground mb-2">
                  {review.title}
                </h5>
              )}
              {review.content && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {review.content}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de la Reseña</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-lg">{getUserName()}</h4>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={review.rating} size="md" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
            {showProduct && review.products && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleProductClick}
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Producto
              </Button>
            )}
          </div>

          {(review.title || review.content) && (
            <div className="space-y-3">
              {review.title && (
                <h5 className="font-semibold text-foreground text-xl">
                  {review.title}
                </h5>
              )}
              {review.content && (
                <p className="text-muted-foreground leading-relaxed">
                  {review.content}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewCard;
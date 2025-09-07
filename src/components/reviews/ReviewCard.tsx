import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StarRating from './StarRating';
import { Review } from '@/hooks/useReviews';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewCardProps {
  review: Review;
  showProduct?: boolean;
}

const ReviewCard = ({ review, showProduct = false }: ReviewCardProps) => {
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

  return (
    <Card className="cyber-border bg-card/50 backdrop-blur-sm">
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
  );
};

export default ReviewCard;
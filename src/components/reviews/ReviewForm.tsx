import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import StarRating from './StarRating';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Star, Edit2 } from 'lucide-react';

interface ReviewFormProps {
  productId?: string;
  productTitle?: string;
  onSubmitSuccess?: () => void;
}

const ReviewForm = ({ productId, productTitle, onSubmitSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { submitReview, userReview, canUserReview } = useReviews(productId);
  const { user } = useAuth();

  useEffect(() => {
    const checkCanReview = async () => {
      if (user) {
        const permitted = await canUserReview();
        setCanReview(permitted);
      }
    };
    checkCanReview();
  }, [user, canUserReview]);

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setTitle(userReview.title || '');
      setContent(userReview.content || '');
    }
  }, [userReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await submitReview(rating, title, content);
      if (success) {
        if (!userReview) {
          // Solo limpiar si es nueva reseña
          setRating(0);
          setTitle('');
          setContent('');
        }
        setShowForm(false);
        onSubmitSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Debes iniciar sesión para dejar una reseña
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!canReview) {
    return (
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {productId 
              ? "Solo puedes reseñar productos que hayas comprado"
              : "Debes haber realizado al menos una compra para reseñar la tienda"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!showForm && !userReview) {
    return (
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <Button 
            onClick={() => setShowForm(true)}
            className="w-full"
            variant="outline"
          >
            <Star className="w-4 h-4 mr-2" />
            Escribir Reseña
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!showForm && userReview) {
    return (
      <Card className="cyber-border bg-card/30 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Tu reseña</p>
              <StarRating rating={userReview.rating} size="sm" />
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              variant="outline"
              size="sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cyber-border bg-card/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          {userReview ? 'Editar Reseña' : 'Escribir Reseña'}
          {productTitle && (
            <span className="text-sm font-normal text-muted-foreground">
              - {productTitle}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Calificación *
            </label>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Título (opcional)
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumen de tu experiencia..."
              maxLength={100}
              className="cyber-input"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
              Comentario (opcional)
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comparte tu experiencia detallada..."
              maxLength={500}
              rows={4}
              className="cyber-input resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {userReview ? 'Actualizar Reseña' : 'Enviar Reseña'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;
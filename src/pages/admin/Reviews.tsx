import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StarRating from '@/components/reviews/StarRating';
import { useToast } from '@/hooks/use-toast';
import { Review } from '@/hooks/useReviews';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Star,
  Calendar,
  User,
  Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'store'>('all');
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: reviewsData, error } = await query;

      if (error) throw error;

      // Obtener información adicional de usuarios y productos
      if (reviewsData && reviewsData.length > 0) {
        const userIds = [...new Set(reviewsData.map(r => r.user_id))];
        const productIds = [...new Set(reviewsData.filter(r => r.product_id).map(r => r.product_id))];

        // Obtener perfiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        // Obtener productos
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
  };

  const toggleApproval = async (reviewId: string, currentStatus: boolean | null) => {
    try {
      const newStatus = !currentStatus;
      
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "¡Éxito!",
        description: `Reseña ${newStatus ? 'aprobada' : 'ocultada'} correctamente`,
      });

      await fetchReviews();
    } catch (error) {
      console.error('Error toggling approval:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la reseña",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter(review => {
    // Filtro por texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = `${review.profiles?.first_name || ''} ${review.profiles?.last_name || ''}`.toLowerCase();
      const productName = review.products?.title?.toLowerCase() || '';
      const content = (review.content || '').toLowerCase();
      const title = (review.title || '').toLowerCase();

      if (!userName.includes(searchLower) && 
          !productName.includes(searchLower) && 
          !content.includes(searchLower) && 
          !title.includes(searchLower)) {
        return false;
      }
    }

    // Filtro por tipo
    if (filterType === 'product' && !review.product_id) return false;
    if (filterType === 'store' && review.product_id) return false;

    // Filtro por aprobación
    if (filterApproval === 'approved' && !review.is_approved) return false;
    if (filterApproval === 'pending' && review.is_approved) return false;

    return true;
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const getUserName = (review: Review) => {
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Gestión de Reseñas</h1>
              <p className="text-muted-foreground">
                Administra las reseñas de productos y de la tienda
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{reviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Aprobadas</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => r.is_approved).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => r.product_id).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Tienda</p>
                  <p className="text-2xl font-bold">
                    {reviews.filter(r => !r.product_id).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar reseñas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de reseña" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="product">Productos</SelectItem>
                  <SelectItem value="store">Tienda</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterApproval} onValueChange={(value: any) => setFilterApproval(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reseñas ({filteredReviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Producto/Tienda</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getUserName(review)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {review.product_id ? (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              {review.products?.title || 'Producto eliminado'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-yellow-600">
                              Reseña de Tienda
                            </span>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <StarRating rating={review.rating} size="sm" />
                      </TableCell>
                      
                      <TableCell className="max-w-xs">
                        {review.title && (
                          <p className="font-medium text-sm mb-1">
                            {review.title}
                          </p>
                        )}
                        {review.content && (
                          <p className="text-sm text-muted-foreground truncate">
                            {review.content}
                          </p>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={review.is_approved ? "default" : "secondary"}
                          className={review.is_approved ? "bg-green-500" : "bg-gray-500"}
                        >
                          {review.is_approved ? 'Aprobada' : 'Oculta'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={review.is_approved || false}
                            onCheckedChange={() => toggleApproval(review.id, review.is_approved)}
                          />
                          {review.is_approved ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredReviews.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay reseñas</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' || filterApproval !== 'all'
                    ? 'No se encontraron reseñas con los filtros aplicados'
                    : 'Aún no hay reseñas en el sistema'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Reviews;
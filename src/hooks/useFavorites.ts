import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchFavorites = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select('product_id')
        .eq('user_id', user.id)

      if (error) throw error

      setFavorites(data.map(item => item.product_id))
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([])
    }
  }, [user, fetchFavorites])

  const addToFavorites = async (productId: string) => {
    if (!user) {
      toast({
        title: "Iniciar sesión requerido",
        description: "Debes iniciar sesión para agregar favoritos.",
        variant: "destructive",
      })
      return false
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: user.id, product_id: productId })

      if (error) throw error

      setFavorites(prev => [...prev, productId])
      toast({
        title: "Agregado a favoritos",
        description: "El juego se agregó a tus favoritos.",
      })
      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      toast({
        title: "Error",
        description: "No se pudo agregar a favoritos.",
        variant: "destructive",
      })
      return false
    }
  }

  const removeFromFavorites = async (productId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error

      setFavorites(prev => prev.filter(id => id !== productId))
      toast({
        title: "Eliminado de favoritos",
        description: "El juego se eliminó de tus favoritos.",
      })
      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar de favoritos.",
        variant: "destructive",
      })
      return false
    }
  }

  const toggleFavorite = async (productId: string) => {
    const isFavorite = favorites.includes(productId)
    
    if (isFavorite) {
      return await removeFromFavorites(productId)
    } else {
      return await addToFavorites(productId)
    }
  }

  const isFavorite = (productId: string) => favorites.includes(productId)

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  }
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface CartItem {
  id: string
  product_id?: string
  bundle_id?: string
  product_name: string
  price: number
  quantity: number
  image_url?: string
  type: 'product' | 'bundle'
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  totalItems: number
  totalPrice: number
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  removeFromCart: (id: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Load cart when user changes
  useEffect(() => {
    if (user) {
      refreshCart()
    } else {
      // Load from localStorage for guests
      loadGuestCart()
    }
  }, [user])

  const loadGuestCart = () => {
    try {
      const guestCart = localStorage.getItem('guest-cart')
      if (guestCart) {
        setItems(JSON.parse(guestCart))
      }
    } catch (error) {
      console.error('Error loading guest cart:', error)
    }
  }

  const saveGuestCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guest-cart', JSON.stringify(cartItems))
    } catch (error) {
      console.error('Error saving guest cart:', error)
    }
  }

  const refreshCart = async () => {
    if (!user) {
      loadGuestCart()
      return
    }

    setLoading(true)
    try {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            bundle_id,
            quantity,
            price,
            products(title, image_url),
            product_bundles(name)
          `)
          .eq('user_id', user.id)

        if (error) throw error

        const cartItems: CartItem[] = data.map(item => ({
          id: item.id,
          product_id: item.product_id || undefined,
          bundle_id: item.bundle_id || undefined,
          product_name: item.products?.title || item.product_bundles?.name || 'Producto',
          price: Number(item.price),
          quantity: item.quantity,
          image_url: item.products?.image_url || undefined,
          type: item.product_id ? 'product' : 'bundle'
        }))

      setItems(cartItems)
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar el carrito.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (newItem: Omit<CartItem, 'id'>) => {
    if (user) {
      // Add to database for authenticated users
      try {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: newItem.product_id,
            bundle_id: newItem.bundle_id,
            quantity: newItem.quantity,
            price: newItem.price
          })

        if (error) throw error
        
        await refreshCart()
        toast({
          title: "Agregado al carrito",
          description: `${newItem.product_name} se agregó correctamente.`,
        })
      } catch (error) {
        console.error('Error adding to cart:', error)
        toast({
          title: "Error",
          description: "No se pudo agregar el producto al carrito.",
          variant: "destructive",
        })
      }
    } else {
      // Add to localStorage for guests
      const existingItem = items.find(item => 
        item.product_id === newItem.product_id && 
        item.bundle_id === newItem.bundle_id
      )

      let newItems: CartItem[]
      if (existingItem) {
        newItems = items.map(item => 
          item.id === existingItem.id 
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        )
      } else {
        newItems = [...items, { ...newItem, id: Date.now().toString() }]
      }

      setItems(newItems)
      saveGuestCart(newItems)
      toast({
        title: "Agregado al carrito",
        description: `${newItem.product_name} se agregó correctamente.`,
      })
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(id)
      return
    }

    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', id)

        if (error) throw error
        await refreshCart()
      } catch (error) {
        console.error('Error updating quantity:', error)
        toast({
          title: "Error",
          description: "No se pudo actualizar la cantidad.",
          variant: "destructive",
        })
      }
    } else {
      const newItems = items.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
      setItems(newItems)
      saveGuestCart(newItems)
    }
  }

  const removeFromCart = async (id: string) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id)

        if (error) throw error
        await refreshCart()
        toast({
          title: "Producto eliminado",
          description: "Se eliminó el producto del carrito.",
        })
      } catch (error) {
        console.error('Error removing from cart:', error)
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto.",
          variant: "destructive",
        })
      }
    } else {
      const newItems = items.filter(item => item.id !== id)
      setItems(newItems)
      saveGuestCart(newItems)
      toast({
        title: "Producto eliminado",
        description: "Se eliminó el producto del carrito.",
      })
    }
  }

  const clearCart = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)

        if (error) throw error
        setItems([])
      } catch (error) {
        console.error('Error clearing cart:', error)
        throw error
      }
    } else {
      setItems([])
      localStorage.removeItem('guest-cart')
    }
  }

  const value = {
    items,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
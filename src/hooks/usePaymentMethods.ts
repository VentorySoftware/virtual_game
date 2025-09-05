import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"

export interface PaymentMethod {
  id: string
  name: string
  code: string
  description: string
  is_active: boolean
  display_order: number
  icon_name: string
  configuration: any
}

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError
      setPaymentMethods(data || [])
    } catch (err: any) {
      console.error('Error fetching payment methods:', err)
      setError(err.message || 'Error al cargar los métodos de pago')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  return {
    paymentMethods,
    loading,
    error,
    refetch: fetchPaymentMethods
  }
}
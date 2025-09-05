import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Function started")

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set")
    logStep("Stripe key verified")

    // Create Supabase client using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    // Get request body
    const { sessionId, orderNumber } = await req.json()
    
    if (!sessionId && !orderNumber) {
      throw new Error("Either sessionId or orderNumber is required")
    }
    logStep("Request received", { sessionId, orderNumber })

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" })

    let order
    let session

    // Get order from database
    if (orderNumber) {
      const { data: orderData, error: orderError } = await supabaseService
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

      if (orderError) throw new Error(`Failed to fetch order: ${orderError.message}`)
      order = orderData
      logStep("Order fetched by number", { orderId: order.id, paymentId: order.payment_id })

      // Get session from order payment_id
      if (order.payment_id) {
        try {
          session = await stripe.checkout.sessions.retrieve(order.payment_id)
          logStep("Session retrieved from order", { sessionId: session.id, status: session.payment_status })
        } catch (error) {
          logStep("Failed to retrieve session from order", { error: error.message })
        }
      }
    }

    // If we have sessionId directly, use it
    if (sessionId && !session) {
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId)
        logStep("Session retrieved directly", { sessionId: session.id, status: session.payment_status })

        // Find order by session ID if not found yet
        if (!order) {
          const { data: orderData, error: orderError } = await supabaseService
            .from('orders')
            .select('*')
            .eq('payment_id', sessionId)
            .single()

          if (!orderError && orderData) {
            order = orderData
            logStep("Order found by session ID", { orderId: order.id })
          }
        }
      } catch (error) {
        logStep("Failed to retrieve session directly", { error: error.message })
      }
    }

    if (!session) {
      throw new Error("Payment session not found")
    }

    if (!order) {
      throw new Error("Order not found")
    }

    // Check payment status
    const isPaid = session.payment_status === 'paid'
    const newStatus = isPaid ? 'paid' : 'pending'
    const newOrderStatus = isPaid ? 'paid' : 'draft'

    logStep("Payment verification", { 
      isPaid, 
      sessionStatus: session.payment_status, 
      newStatus, 
      newOrderStatus 
    })

    // Update order status
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({
        payment_status: newStatus,
        status: newOrderStatus as any,
        payment_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      logStep("Failed to update order", { error: updateError.message })
      throw new Error(`Failed to update order: ${updateError.message}`)
    }

    logStep("Order updated successfully", { orderId: order.id, newStatus })

    // If paid, generate digital content delivery
    if (isPaid) {
      logStep("Payment confirmed, preparing digital delivery")
      
      // Get order items for digital content
      const { data: orderItems, error: itemsError } = await supabaseService
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (!itemsError && orderItems) {
        // Generate digital content codes (placeholder implementation)
        const digitalContent = orderItems.map(item => ({
          product_name: item.product_name,
          digital_code: `VG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          instructions: "Activa este código en tu plataforma de gaming correspondiente."
        }))

        // Update order items with digital content
        for (const item of orderItems) {
          const content = digitalContent.find(dc => dc.product_name === item.product_name)
          if (content) {
            await supabaseService
              .from('order_items')
              .update({ 
                digital_content: JSON.stringify(content)
              })
              .eq('id', item.id)
          }
        }

        logStep("Digital content generated", { itemCount: digitalContent.length })
      }
    }

    return new Response(JSON.stringify({
      verified: true,
      paid: isPaid,
      status: newStatus,
      order_status: newOrderStatus,
      session_id: session.id,
      order_id: order.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logStep("ERROR in verify-payment", { message: errorMessage })
    return new Response(JSON.stringify({ 
      verified: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
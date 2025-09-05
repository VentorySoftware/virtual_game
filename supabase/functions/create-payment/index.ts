import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`)
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

    // Create Supabase client using service role key for writes
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    )

    // Create Supabase client using anon key for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    )

    const authHeader = req.headers.get("Authorization")
    let user = null

    // Try to authenticate user if header exists
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "")
        const { data } = await supabaseClient.auth.getUser(token)
        user = data.user
        logStep("User authenticated", { userId: user?.id, email: user?.email })
      } catch (error) {
        logStep("Authentication failed, proceeding as guest", { error: error.message })
      }
    } else {
      logStep("No auth header, proceeding as guest")
    }

    // Get request body
    const { orderId } = await req.json()
    if (!orderId) throw new Error("Order ID is required")
    logStep("Order ID received", { orderId })

    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw new Error(`Failed to fetch order: ${orderError.message}`)
    if (!order) throw new Error("Order not found")
    logStep("Order fetched", { orderNumber: order.order_number, total: order.total })

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" })

    // Check if customer exists
    let customerId
    const customerEmail = user?.email || order.billing_info?.email
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
        logStep("Existing Stripe customer found", { customerId })
      }
    }

    // Create line items from order
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: "ars",
        product_data: {
          name: item.product_name,
          description: `Producto digital - ${item.product_name}`,
        },
        unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    logStep("Line items created", { itemCount: lineItems.length })

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000"
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/order-confirmation/${order.order_number}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
      },
    })

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url })

    // Update order with Stripe session ID
    const { error: updateError } = await supabaseService
      .from('orders')
      .update({
        payment_id: session.id,
        payment_status: 'pending',
        status: 'pending' as const
      })
      .eq('id', orderId)

    if (updateError) {
      logStep("Warning: Failed to update order with session ID", { error: updateError.message })
    } else {
      logStep("Order updated with session ID")
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logStep("ERROR in create-payment", { message: errorMessage })
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
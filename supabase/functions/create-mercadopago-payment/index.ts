import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    // Parse the request body
    const { orderId } = await req.json();

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch the order details
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          price
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    console.log("Order found:", order);

    // Prepare items for MercadoPago
    const items = order.order_items.map((item: any) => ({
      title: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.price),
    }));

    console.log("MercadoPago items:", items);

    // Create MercadoPago preference
    const mercadoPagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoAccessToken) {
      throw new Error("MercadoPago access token not configured");
    }

    const preferenceData = {
      items: items,
      back_urls: {
        success: `${req.headers.get("origin")}/order-confirmation/${order.order_number}?status=approved`,
        failure: `${req.headers.get("origin")}/order-confirmation/${order.order_number}?status=rejected`,
        pending: `${req.headers.get("origin")}/order-confirmation/${order.order_number}?status=pending`
      },
      auto_return: "approved",
      external_reference: order.id,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      },
      payer: {
        email: user.email,
        name: order.billing_info?.firstName || "",
        surname: order.billing_info?.lastName || ""
      }
    };

    console.log("Creating MercadoPago preference:", preferenceData);

    const mercadoPagoResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mercadoPagoResponse.ok) {
      const errorText = await mercadoPagoResponse.text();
      console.error("MercadoPago API error:", errorText);
      throw new Error(`MercadoPago API error: ${mercadoPagoResponse.status}`);
    }

    const mercadoPagoData = await mercadoPagoResponse.json();
    console.log("MercadoPago response:", mercadoPagoData);

    // Update the order with the MercadoPago payment ID
    const { error: updateError } = await supabaseService
      .from("orders")
      .update({ payment_id: mercadoPagoData.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
    }

    return new Response(JSON.stringify({ 
      id: mercadoPagoData.id,
      init_point: mercadoPagoData.init_point 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating MercadoPago payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
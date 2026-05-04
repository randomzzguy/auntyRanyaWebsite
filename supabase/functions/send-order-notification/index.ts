import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'aroaajm@gmail.com'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { record } = await req.json()
    
    const shipping = record.shipping_json || {}
    const customerEmail = shipping.email || 'unknown@example.com'
    const customerName = `${shipping.first || ''} ${shipping.last || ''}`.trim() || 'Customer'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Ranya Ibrahim Ahmed <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `New Order #${record.id.slice(0,8)} — EGP ${record.total}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#E8774D;">New Order Received!</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Order ID</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${record.id}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Customer</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${customerName}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Email</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${customerEmail}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Total</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">EGP ${record.total}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Payment</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">${record.payment_method}</td></tr>
              <tr><td style="padding:8px 0;"><strong>Status</strong></td><td style="padding:8px 0;">${record.status}</td></tr>
            </table>
            <a href="https://aunty-ranya-website.vercel.app/admin" style="display:inline-block;padding:12px 24px;background:#E8774D;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">Open Admin Dashboard</a>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(error)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

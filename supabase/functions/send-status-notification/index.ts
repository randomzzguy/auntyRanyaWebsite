import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { record, old_record } = await req.json()
    
    // Only send if status actually changed
    if (old_record?.status === record.status) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Status unchanged' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const shipping = record.shipping_json || {}
    const customerEmail = shipping.email
    if (!customerEmail) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No customer email' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is pending confirmation.',
      paid: 'Payment confirmed! Your order is being prepared.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'Your order has been cancelled.',
      refunded: 'A refund has been processed for your order.',
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Ranya Ibrahim Ahmed <onboarding@resend.dev>',
        to: [customerEmail],
        subject: `Order #${record.id.slice(0,8)} Update — ${record.status}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#E8774D;">Order Status Update</h2>
            <p>Hi ${shipping.first || 'there'},</p>
            <p style="font-size:18px;padding:16px;background:#f9f9f9;border-radius:12px;">${statusMessages[record.status] || `Your order status is now: ${record.status}`}</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Order ID</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">#${record.id.slice(0,8)}</td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #eee;"><strong>Total</strong></td><td style="padding:8px 0;border-bottom:1px solid #eee;">EGP ${record.total}</td></tr>
              <tr><td style="padding:8px 0;"><strong>Status</strong></td><td style="padding:8px 0;">${record.status}</td></tr>
            </table>
            <a href="https://aunty-ranya-website.vercel.app/account" style="display:inline-block;padding:12px 24px;background:#E8774D;color:#fff;text-decoration:none;border-radius:999px;font-weight:bold;">View Your Orders</a>
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

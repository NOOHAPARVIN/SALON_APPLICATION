# Rospa Salon - Production Deployment Checklist

Follow these steps when moving the Rospa Salon app to production hosting (e.g., Vercel).

## 1. Vercel Environment Variables
You must configure the following Environment Variables in your Vercel Project Settings (`Settings > Environment Variables`):

| Variable Name | Value Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your live Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your live Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your live Supabase service_role key (used for admin API bypasses) |
| `STRIPE_SECRET_KEY` | Your **Live** Stripe Secret Key (starts with `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe Webhook signing secret (starts with `whsec_...`) |
| `TWILIO_ACCOUNT_SID` | Your Production Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Production Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Your registered Meta WhatsApp Business Number (e.g., `whatsapp:+1234567890`) |

## 2. Setting Up Stripe Webhooks
To automatically mark bookings as "Paid/Confirmed":
1. Go to your **Stripe Dashboard > Developers > Webhooks**.
2. Click **Add an endpoint**.
3. Set the Endpoint URL to: `https://www.yourdomain.com/api/webhooks`
4. Select the event to listen to: `checkout.session.completed`.
5. Save the endpoint and reveal the **Signing Secret** (`whsec_...`). Paste this into Vercel as `STRIPE_WEBHOOK_SECRET`.

## 3. WhatsApp Twilio Registration (Meta Business)
For live WhatsApp messages to work:
1. Connect your Facebook Business Manager to Twilio.
2. Submit your WhatsApp number for verification.
3. **Important**: You must submit your Booking Confirmation message as an **Approved Template** in Twilio if you want to send messages outside of a 24-hour customer service window.
   - Go to `Messaging > Senders > WhatsApp Templates` in Twilio and submit the message structure matching the one generated in `app/api/payments/confirm-payment/route.ts`.

## 4. Run the RLS Database Policies
Open the Supabase dashboard for your live project:
1. Go to the **SQL Editor**.
2. Open the `production_rls_policies.sql` file included in the root of this project.
3. Copy its contents, paste them into the editor, and click **Run**. This will instantly secure your database from malicious frontend manipulation.

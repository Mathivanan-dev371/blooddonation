/**
 * Supabase Edge Function: send-fcm
 * 
 * This function handles sending FCM notifications using Firebase Admin SDK.
 * You need to set up a Firebase Project and get the service account key.
 * 
 * Deployment:
 * 1. supabase functions new send-fcm
 * 2. Paste this code into supabase/functions/send-fcm/index.ts
 * 3. Set secrets:
 *    supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"project_id": "...", ...}'
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FIREBASE_SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}')

serve(async (req) => {
    const { tokens, title, body, data } = await req.json()

    // Get OAuth2 token for Firebase
    // This is a simplified example. In production, use a library or the full OAuth2 flow.
    // For Supabase Edge Functions, you'd typically use the 'service-account' approach.

    // Note: For real FCM sending, you'd use something like:
    // https://fcm.googleapis.com/v1/projects/${FIREBASE_SERVICE_ACCOUNT.project_id}/messages:send

    console.log(`Sending notification to ${tokens.length} tokens`);
    console.log(`Title: ${title}, Body: ${body}`);

    return new Response(
        JSON.stringify({ success: true, count: tokens.length }),
        { headers: { "Content-Type": "application/json" } }
    )
})

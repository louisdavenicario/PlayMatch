// @ts-nocheck

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "npm:@supabase/supabase-js";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);
webpush.setVapidDetails(
  "mailto:admin@playmatch.com",
  Deno.env.get("VAPID_PUBLIC_KEY"),
  Deno.env.get("VAPID_PRIVATE_KEY")
);
serve(async (req) => {
  try {
    const { user_id, title, message, url = "/" } = await req.json();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id);
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response("No subscriptions found", {
        status: 200,
      });
    }
    const payload = JSON.stringify({
      title,
      message,
      url,
    });
    for (const sub of subs) {
      const subscription = sub.subscription;
      if (!subscription?.endpoint || !subscription?.keys) {
        console.error("Invalid subscription object:", sub);
        continue;
      }
      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error("Push failed:", err);
      }
    }
    return new Response("Push sent", {
      status: 200,
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response("Error sending push", {
      status: 500,
    });
  }
});

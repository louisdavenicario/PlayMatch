// @ts-nocheck

import { serve } from "https://deno.land/std/http/server.ts";
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
  const { user_id, title, message } = await req.json();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user_id);
  if (!subs || subs.length === 0) {
    return new Response("No subscriptions found", {
      status: 200,
    });
  }
  for (const sub of subs) {
    const payload = JSON.stringify({
      title,
      message,
      url: "/",
    });
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
    } catch (err) {
      console.error("Push failed:", err);
    }
  }
  return new Response("Push sent", {
    status: 200,
  });
});

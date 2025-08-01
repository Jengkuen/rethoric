import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Clerk webhook handler
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get headers and body for signature verification
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing required headers", { status: 400 });
    }

    const body = await request.text();

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let payload: any;

    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as any;
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log(`Received Clerk webhook: ${payload.type}`);

    // Handle user creation
    if (payload.type === "user.created") {
      const { id, email_addresses, first_name, last_name } = payload.data;

      await ctx.runMutation(internal.users.createUserFromWebhook, {
        clerkId: id,
        email: email_addresses?.[0]?.email_address || "",
        name: first_name && last_name ? `${first_name} ${last_name}` : (first_name || last_name || undefined),
      });

      console.log(`Created user for Clerk ID: ${id}`);
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
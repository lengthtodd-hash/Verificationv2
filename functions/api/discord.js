export async function onRequestPost(context) {
  const webhookUrl = context.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: "DISCORD_WEBHOOK_URL not configured" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Clone the request to forward it
  const request = context.request;
  const formData = await request.formData();

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "Discord API error", details: errorText }), { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

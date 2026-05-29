import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const body = await req.json();

  const groqBody: Record<string, unknown> = {
    model: "llama-3.3-70b-versatile",
    max_tokens: body.max_tokens || 1000,
    messages: [
      ...(body.system ? [{ role: "system", content: body.system }] : []),
      ...body.messages,
    ],
  };

  // json_mode apenas quando explicitamente solicitado (quiz)
  if (body.json_mode === true) {
    groqBody.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify(groqBody),
  });

  const data = await response.json();

  const converted = {
    content: [{ text: data.choices?.[0]?.message?.content || "" }]
  };

  return new Response(JSON.stringify(converted), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
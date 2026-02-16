import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTIVITY_LABELS: Record<string, string> = {
  tree_plantation: "tree planting or plantation activity",
  cleanup: "cleanup drive or waste collection activity",
  recycling: "recycling or waste sorting activity",
  eco_habit: "eco-friendly habit such as using reusable items, composting, cycling, or conservation",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, activityType } = await req.json();

    if (!imageBase64 || !activityType) {
      return new Response(
        JSON.stringify({ error: "imageBase64 and activityType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const activityDescription = ACTIVITY_LABELS[activityType] || activityType;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an image verification assistant for an environmental volunteering app. Your job is to determine whether an uploaded photo shows evidence of a specific activity type. Be reasonably lenient — the photo doesn't need to be perfect, just clearly related to the activity.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Does this image show evidence of "${activityDescription}"? Analyze the image and call the verify_image function with your assessment.`,
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_image",
              description:
                "Return the verification result for whether the image matches the expected activity type.",
              parameters: {
                type: "object",
                properties: {
                  match: {
                    type: "boolean",
                    description: "True if the image shows the expected activity.",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score between 0 and 1.",
                  },
                  reason: {
                    type: "string",
                    description: "Short explanation of why the image does or does not match.",
                  },
                },
                required: ["match", "confidence", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_image" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: allow submission but mark as unverified
      return new Response(
        JSON.stringify({ match: true, confidence: 0, reason: "Verification unavailable — allowed by default." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-activity-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

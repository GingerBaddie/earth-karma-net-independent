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

    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY");
    if (!GOOGLE_AI_KEY) {
      throw new Error("GOOGLE_AI_KEY is not configured");
    }

    const activityDescription = ACTIVITY_LABELS[activityType] || activityType;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an image verification assistant for an environmental volunteering app. Your job is to determine whether an uploaded photo shows evidence of a specific activity type. Be reasonably lenient — the photo doesn't need to be perfect, just clearly related to the activity.

Does this image show evidence of "${activityDescription}"? Respond with a JSON object containing:
- match: boolean (true if image shows the expected activity)
- confidence: number (confidence score between 0 and 1)
- reason: string (short explanation of your assessment)`,
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64.split(",")[1] || imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

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
    
    // Parse the response from Google Gemini API
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      // Fallback: allow submission but mark as unverified
      return new Response(
        JSON.stringify({ match: true, confidence: 0, reason: "Verification unavailable — allowed by default." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract JSON from the response text
    let result;
    try {
      // Try to parse the content as JSON
      result = JSON.parse(content);
    } catch {
      // Try to extract JSON from text with markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Fallback if parsing fails
        return new Response(
          JSON.stringify({ match: true, confidence: 0, reason: "Verification unavailable — allowed by default." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Ensure the result has the required fields
    const verificationResult = {
      match: result.match || false,
      confidence: result.confidence || 0,
      reason: result.reason || "Unable to verify image",
    };

    return new Response(JSON.stringify(verificationResult), {
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

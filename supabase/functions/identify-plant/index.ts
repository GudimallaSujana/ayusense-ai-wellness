import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const AI_GATEWAY_KEY = Deno.env.get("AI_GATEWAY_KEY");
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL");
    if (!AI_GATEWAY_KEY) throw new Error("AI_GATEWAY_KEY not configured");
    if (!AI_GATEWAY_URL) throw new Error("AI_GATEWAY_URL not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Fetch all herb names for the AI to match against
    const { data: herbs } = await supabase
      .from("herbs")
      .select("name, preview, pacify, aggravate, tridosha, rasa, guna, virya, vipaka, prabhav");

    const herbNames = (herbs || []).map((h: any) => h.name);

    // Also get disease data for cross-referencing
    const { data: diseases } = await supabase
      .from("diseases")
      .select("disease, ayurvedic_herbs, formulation, herbal_remedies, symptoms");

    const systemPrompt = `You are AyuSense, a premium AI-powered Ayurvedic plant identification system. You are an expert botanist and Ayurvedic practitioner.

CRITICAL: You have access to a database of ${herbNames.length} medicinal herbs. You MUST try to match the plant in the image to one of these herbs. Here is the complete list of herb names in the database:

${herbNames.join(", ")}

When analyzing a plant image:
1. First identify the plant visually using morphological features
2. Then MATCH it to the closest herb name from the database list above
3. Use the EXACT name from the database (case-sensitive match)
4. If no exact match, use fuzzy matching to find the closest name

You MUST respond in this exact JSON format:
{
  "plantName": "Exact name from database list (e.g., Tulsi, Amla, Ashwagandha)",
  "scientificName": "Latin binomial name",
  "family": "Botanical family",
  "confidence": 92,
  "features": ["List of visual features detected that led to identification"],
  "ayurvedicProfile": {
    "rasa": ["Taste qualities"],
    "guna": ["Qualities"],
    "virya": "Potency",
    "vipaka": "Post-digestive effect",
    "doshaEffect": {
      "pacifies": ["Doshas it pacifies"],
      "aggravates": ["Doshas it may aggravate"]
    },
    "prabhav": ["Special therapeutic actions"]
  },
  "benefits": ["Detailed health benefits"],
  "remedies": ["Detailed safe home remedies with measurements"],
  "climate": "Climate suitability",
  "availability": "Regional availability",
  "alternatives": ["Alternative plants from database"],
  "precautions": ["Safety precautions"],
  "traditionalUses": "Traditional Ayurvedic uses",
  "whyIdentified": "Detailed explanation of visual analysis"
}

If you cannot identify the plant, set confidence below 30 and explain what you see.`;

    // Step 1: AI identifies the plant
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this medicinal plant and match it to the database. Use the EXACT herb name from the provided list." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Service credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      parsed = { plantName: "Unknown", confidence: 0, error: "Failed to parse AI response" };
    }

    // Step 2: Enrich with database data
    const identifiedName = parsed.plantName || "";
    
    // Fuzzy match: find the closest herb from database
    const nameLower = identifiedName.toLowerCase().trim();
    let matchedHerb = (herbs || []).find((h: any) => h.name.toLowerCase() === nameLower);
    
    if (!matchedHerb) {
      // Try partial matching
      matchedHerb = (herbs || []).find((h: any) => 
        nameLower.includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(nameLower)
      );
    }
    
    if (!matchedHerb) {
      // Try matching common name variations (e.g., "Tulsi / Holy Basil" -> "Tulsi")
      const firstWord = nameLower.split(/[\s\/,\(]+/)[0].trim();
      matchedHerb = (herbs || []).find((h: any) => h.name.toLowerCase() === firstWord);
    }

    // Enrich AI response with real database data
    if (matchedHerb) {
      parsed.plantName = matchedHerb.name; // Use exact DB name
      parsed.databaseMatch = true;
      
      // Override Ayurvedic profile with verified database data
      parsed.ayurvedicProfile = {
        rasa: matchedHerb.rasa || parsed.ayurvedicProfile?.rasa || [],
        guna: matchedHerb.guna || parsed.ayurvedicProfile?.guna || [],
        virya: matchedHerb.virya || parsed.ayurvedicProfile?.virya || "",
        vipaka: matchedHerb.vipaka || parsed.ayurvedicProfile?.vipaka || "",
        doshaEffect: {
          pacifies: matchedHerb.pacify || parsed.ayurvedicProfile?.doshaEffect?.pacifies || [],
          aggravates: matchedHerb.aggravate || parsed.ayurvedicProfile?.doshaEffect?.aggravates || [],
        },
        prabhav: matchedHerb.prabhav || parsed.ayurvedicProfile?.prabhav || [],
      };

      if (matchedHerb.preview) {
        parsed.description = matchedHerb.preview;
      }

      // Find diseases this herb treats from the disease database
      const relatedDiseases = (diseases || []).filter((d: any) => {
        const herbsStr = (d.ayurvedic_herbs || "").toLowerCase();
        return herbsStr.includes(matchedHerb.name.toLowerCase());
      });

      if (relatedDiseases.length > 0) {
        parsed.treatedConditions = relatedDiseases.map((d: any) => ({
          disease: d.disease,
          symptoms: d.symptoms,
          formulation: d.formulation,
          herbalRemedies: d.herbal_remedies,
        }));

        // Enrich remedies with database formulations
        const dbRemedies = relatedDiseases
          .filter((d: any) => d.formulation)
          .map((d: any) => `For ${d.disease}: ${d.formulation}`);
        if (dbRemedies.length > 0) {
          parsed.remedies = [...(parsed.remedies || []), ...dbRemedies];
        }
      }

      // Find alternative herbs with similar dosha effects
      const samePackify = matchedHerb.pacify || [];
      const alternatives = (herbs || [])
        .filter((h: any) => 
          h.name !== matchedHerb.name && 
          (h.pacify || []).some((p: string) => samePackify.includes(p))
        )
        .slice(0, 5)
        .map((h: any) => h.name);
      if (alternatives.length > 0) {
        parsed.alternatives = alternatives;
      }
    } else {
      parsed.databaseMatch = false;
      parsed.warning = "This plant was not found in our verified database. Results are AI-generated and should be verified.";
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-plant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

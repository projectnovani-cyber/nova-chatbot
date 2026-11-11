const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

function errorResponse(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!env.AI) {
      return errorResponse("Cloudflare Workers AI binding is not configured.", 503);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const incoming = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
        const image = typeof body.image === "string" ? body.image : "";

        if (image && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 5_600_000)) {
          return errorResponse("Please upload a PNG, JPG, or WebP image smaller than 4 MB.");
        }

        const messages = incoming
          .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 12000) }));

        if (!messages.length) {
          return errorResponse("Please enter a message or attach an image.");
        }

        if (image) {
          const last = messages[messages.length - 1];
          if (last.role !== "user") return errorResponse("An image must be attached to a user message.");
          last.content = [
            { type: "text", text: last.content || "Please describe and analyse this image." },
            { type: "image_url", image_url: { url: image } }
          ];
        }

        const style = String(body.style || "Friendly and intelligent").slice(0, 160);
        const length = String(body.length || "Balanced");
        const lengthInstruction = length === "Short" ? "Keep replies brief and direct." : length === "Detailed" ? "Give thorough explanations with useful context and examples when appropriate." : "Use a balanced level of detail.";
        const memory = String(body.memory || "").slice(0, 3000);
        const system = [
          "You are Nova, a friendly and intelligent personal AI assistant. Be clear, helpful, age-appropriate, and honest.",
          "When the user attaches an image, inspect it carefully and answer based on visible details. If something is unclear, say so.",
          "Do not claim to have performed actions you have not performed.",
          `Response style: ${style}.`,
          lengthInstruction,
          memory ? `User-provided memory notes: ${memory}` : ""
        ].filter(Boolean).join("\n\n");

        const result = await env.AI.run(MODEL, {
          messages: [{ role: "system", content: system }, ...messages],
          chat_template_kwargs: { enable_thinking: false },
          max_tokens: length === "Short" ? 500 : length === "Detailed" ? 1800 : 1200
        });

        const reply = result?.response || result?.choices?.[0]?.message?.content || result?.choices?.[0]?.text;
        if (typeof reply !== "string" || !reply.trim()) {
          console.error("Nova AI returned an unexpected response shape:", result);
          return errorResponse("Nova received an empty or unexpected response from the AI service.", 502);
        }

        return Response.json({ reply: reply.trim() });
      } catch (error) {
        console.error("Nova chat request failed:", error);
        return errorResponse("Nova couldn't complete the request. Please try again.", 500);
      }
    }

    if (url.pathname === "/api/generate-image" && request.method === "POST") {
      try {
        const body = await request.json();
        const prompt = String(body.prompt || "").trim().slice(0, 1800);
        if (!prompt) return errorResponse("Please describe the image you want Nova to create.");
        const result = await env.AI.run(IMAGE_MODEL, { prompt, steps: 4 });
        if (!result?.image) {
          console.error("Image model returned an unexpected response shape:", result);
          return errorResponse("The image service returned no image. Please try again.", 502);
        }
        return Response.json({ image: `data:image/jpeg;base64,${result.image}` });
      } catch (error) {
        console.error("Nova image generation failed:", error);
        return errorResponse("Nova couldn't generate that image right now. Please try again.", 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

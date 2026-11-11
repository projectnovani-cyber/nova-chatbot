const MODEL = "@cf/google/gemma-4-26b-a4b-it";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!env.AI) {
        return Response.json(
          { error: "AI binding is not configured." },
          { status: 503 }
        );
      }

      try {
        const body = await request.json();
        const messages = Array.isArray(body.messages)
          ? body.messages.slice(-16)
          : [];

        const style = String(
          body.style || "Friendly and intelligent"
        ).slice(0, 160);

        const memory = String(body.memory || "").slice(0, 3000);

        const system = [
          "You are Nova, a friendly and intelligent personal AI assistant. Be clear, helpful, age-appropriate, and honest.",
          "Do not claim to have performed actions you have not performed.",
          `Response style: ${style}.`,
          memory ? `User-provided memory notes: ${memory}` : ""
        ].filter(Boolean).join("\n\n");

        const result = await env.AI.run(MODEL, {
          messages: [
            { role: "system", content: system },
            ...messages
          ],
          chat_template_kwargs: {
            enable_thinking: false
          }
        });

        const reply =
          result?.response ||
          result?.choices?.[0]?.message?.content ||
          result?.choices?.[0]?.text;

        if (typeof reply !== "string" || !reply.trim()) {
          console.error("Nova AI returned an unexpected response shape:", result);
          return Response.json(
            { error: "Nova received an empty or unexpected response from the AI service." },
            { status: 502 }
          );
        }

        return Response.json({ reply: reply.trim() });

      } catch (e) {
        console.error("Nova AI request failed:", e);
        return Response.json({
          error: "Nova couldn't complete the AI request. Please try again."
        }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};

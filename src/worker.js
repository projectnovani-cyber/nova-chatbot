
const MODEL = "@cf/meta/llama-3.1-8b-instruct";

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
          ]
        });

        return Response.json({
          reply: result?.response ||
            "I couldn't create a reply just now. Please try again."
        });

      } catch (e) {
        return Response.json({
          error: "Nova couldn't reach the AI service. Please try again."
        }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};

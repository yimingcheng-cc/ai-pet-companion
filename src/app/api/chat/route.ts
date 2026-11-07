import OpenAI from "openai";
import { chatSchema, replySchema } from "@/lib/schema";
import {
  instructions,
  responseFormat,
  partialReply,
} from "@/lib/ai/personality";
import { guard, boundedJson, providerError } from "@/lib/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  let input;
  try {
    input = chatSchema.parse(await boundedJson(request));
  } catch {
    return Response.json(
      { error: "消息格式无效，单条消息最多 4000 字。" },
      { status: 400 },
    );
  }
  if (!process.env.OPENAI_API_KEY)
    return Response.json(
      {
        error: "尚未连接 AI。请在服务器配置 OPENAI_API_KEY 后重试。",
        code: "SETUP_REQUIRED",
      },
      { status: 503 },
    );
  const abort = new AbortController();
  const signal = AbortSignal.any([
    request.signal,
    abort.signal,
    AbortSignal.timeout(55000),
  ]);
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 50000,
    });
    const upstream = await client.responses.create(
      {
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
        instructions: instructions(
          input.pet,
          input.state,
          input.memories,
          input.language,
        ),
        input: input.messages
          .filter((m) => !m.failed)
          .map((m) => ({ role: m.role, content: m.content })),
        text: { format: responseFormat },
        stream: true,
        store: false,
        max_output_tokens: 1200,
      },
      { signal },
    );
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        let raw = "",
          sent = "";
        const send = (data: unknown) =>
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        try {
          for await (const event of upstream) {
            if (event.type === "response.output_text.delta") {
              raw += event.delta;
              const reply = partialReply(raw);
              if (reply.startsWith(sent) && reply.length > sent.length) {
                send({ type: "delta", text: reply.slice(sent.length) });
                sent = reply;
              }
            } else if (
              event.type === "response.failed" ||
              event.type === "response.incomplete"
            ) {
              throw new Error("Incomplete model response");
            }
          }
          const parsed = replySchema.parse(JSON.parse(raw));
          if (
            parsed.reply.startsWith(sent) &&
            parsed.reply.length > sent.length
          )
            send({ type: "delta", text: parsed.reply.slice(sent.length) });
          send({ type: "action", action: parsed.action, mood: parsed.mood });
          send({ type: "done" });
        } catch (error) {
          if (!signal.aborted)
            console.error(
              JSON.stringify({
                event: "chat_failed",
                kind: error instanceof Error ? error.name : "unknown",
              }),
            );
          try {
            send({ type: "error", error: providerError(error) });
          } catch {}
        } finally {
          try {
            controller.close();
          } catch {}
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return Response.json({ error: providerError(error) }, { status: 502 });
  }
}

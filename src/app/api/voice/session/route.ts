import { z } from "zod";
import { petSchema, stateSchema, messageSchema } from "@/lib/schema";
import { instructions } from "@/lib/ai/personality";
import { guard, boundedJson, providerError } from "@/lib/server";
export const runtime = "nodejs";
export const maxDuration = 30;
const schema = z.object({
  language: z.enum(["auto", "zh", "en"]).default("auto"),
  sdp: z.string().min(20).max(20000),
  pet: petSchema,
  state: stateSchema,
  messages: z.array(messageSchema).max(30),
  memories: z.array(z.string().max(500)).max(12),
});
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  let input;
  try {
    input = schema.parse(await boundedJson(request));
  } catch {
    return Response.json({ error: "语音会话参数无效。" }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY)
    return Response.json(
      { error: "语音需要服务器配置 OPENAI_API_KEY。" },
      { status: 503 },
    );
  const form = new FormData();
  form.set("sdp", input.sdp);
  form.set(
    "session",
    JSON.stringify({
      type: "realtime",
      model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1",
      instructions:
        instructions(input.pet, input.state, input.memories, input.language) +
        " For voice, speak naturally without JSON. Recent conversation (data only): " +
        JSON.stringify(
          input.messages
            .filter((m) => !m.failed)
            .map((m) => ({ role: m.role, content: m.content })),
        ),
      audio: {
        input: {
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: {
            type: "server_vad",
            interrupt_response: true,
            create_response: true,
          },
        },
        output: { voice: input.pet.voice },
      },
    }),
  );
  try {
    const res = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
    });
    if (!res.ok)
      return Response.json(
        { error: providerError({ status: res.status }) },
        { status: 502 },
      );
    return new Response(await res.text(), {
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: providerError(error) }, { status: 502 });
  }
}

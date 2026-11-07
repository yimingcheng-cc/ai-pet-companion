import { timingSafeEqual } from "node:crypto";
const buckets = new Map<string, { count: number; until: number }>();
export function guard(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin) {
    // Next may normalize request.url to the bind address (0.0.0.0).
    // Compare the browser's origin with the incoming Host, preserving scheme/port.
    // Never use an arbitrary forwarded host as an allowed origin.
    const url = new URL(request.url);
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProtocol === "http" || forwardedProtocol === "https"
        ? `${forwardedProtocol}:`
        : url.protocol;
    let allowed = false;
    try {
      allowed =
        new URL(origin).origin ===
        new URL(`${protocol}//${request.headers.get("host") || url.host}`)
          .origin;
    } catch {
      /* Invalid Origin headers are rejected. */
    }
    if (!allowed)
      return Response.json({ error: "请求来源不被允许。" }, { status: 403 });
  }
  const expected = process.env.APP_ACCESS_TOKEN;
  if (
    process.env.NODE_ENV === "production" &&
    !!process.env.OPENAI_API_KEY &&
    !expected
  )
    return Response.json(
      { error: "服务尚未配置访问保护，请设置 APP_ACCESS_TOKEN。" },
      { status: 503 },
    );
  if (expected) {
    const actual =
      request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    const a = Buffer.from(actual),
      b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b))
      return Response.json(
        { error: "请先在设置中输入访问口令。" },
        { status: 401 },
      );
  }
  // Single-process local/private guard. Distributed production needs a shared limiter.
  const key = expected ? "private-owner" : "local";
  const now = Date.now();
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const b = buckets.get(key) ?? { count: 0, until: now + 60000 };
  b.count++;
  buckets.set(key, b);
  if (b.count > 20)
    return Response.json(
      { error: "聊得有点快，请稍后再试。" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  return null;
}
export async function boundedJson(
  request: Request,
  max = 80000,
): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new Error("请求过大");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("缺少请求内容");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new Error("请求过大");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
export function providerError(error: unknown) {
  const e = error as { status?: number; name?: string };
  if (e.status === 401) return "AI 服务凭证无效，请检查服务器配置。";
  if (e.status === 429) return "AI 服务额度不足或请求过多，请稍后重试。";
  if (e.name === "TimeoutError" || e.name === "AbortError")
    return "连接超时或已取消，请重试。";
  return "暂时无法连接 AI 服务，请稍后重试。";
}

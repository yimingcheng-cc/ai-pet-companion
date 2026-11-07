export function GET() {
  return Response.json(
    {
      text: !!process.env.OPENAI_API_KEY,
      voice: !!process.env.OPENAI_API_KEY,
      protected: !!process.env.APP_ACCESS_TOKEN,
      productionBlocked:
        process.env.NODE_ENV === "production" &&
        !!process.env.OPENAI_API_KEY &&
        !process.env.APP_ACCESS_TOKEN,
      storage: "local",
      model: !!process.env.NEXT_PUBLIC_PET_MODEL_URL,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

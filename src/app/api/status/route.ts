import { readLedger, unitBudget } from "@/lib/server/store";

export async function GET() {
  const ledger = await readLedger();
  return Response.json(
    {
      live: {
        tryOn: Boolean(process.env.YOUCAM_API_KEY),
        reader: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL),
      },
      units: { spent: ledger.spent, budget: unitBudget() },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

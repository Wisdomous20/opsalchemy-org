import { getListLeads } from "@/server/composition/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return jsonResponse({ error: "not_found" }, 404);
  }

  try {
    const leads = await getListLeads().execute();

    return jsonResponse(
      {
        leads: leads.map((lead) => ({
          ...lead,
          consentRecordedAt: lead.consentRecordedAt.toISOString(),
          createdAt: lead.createdAt.toISOString(),
          updatedAt: lead.updatedAt.toISOString(),
        })),
      },
      200,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "leads.list",
        status: "failure",
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );

    return jsonResponse({ error: "internal_error" }, 500);
  }
}

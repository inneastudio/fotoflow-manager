import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (supabaseAdmin) {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Za AI pomočnika moraš biti prijavljen." }, { status: 401 });
    }

    const {
      data: { user },
      error
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: "Prijava ni veljavna." }, { status: 401 });
    }
  }

  const values = await request.json().catch(() => null);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      text: fallbackSuggestion(values)
    });
  }

  const prompt = `Pomagaj fotografskemu studiu INNEA/Fiora pripraviti social objavo.

Kontekst:
- Platforma: ${values?.platform ?? "Instagram"}
- Naslov: ${values?.title ?? ""}
- Planiran termin: ${values?.scheduled_at ?? ""}
- Trenutni zapis: ${values?.caption ?? ""}
- Opombe: ${values?.notes ?? ""}
- Link galerije: ${values?.gallery_url ? "dodano" : "ni dodano"}
- Število naloženih slik: ${Array.isArray(values?.storage_urls) ? values.storage_urls.length : 0}

Vrni v slovenščini:
1. kratek nasvet, ali je termin objave dober,
2. predlagan zapis objave v elegantnem, premium tonu,
3. CTA,
4. 8-12 hashtagov,
5. predlog ritma objav za ta tip vsebine.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    return NextResponse.json({
      text: fallbackSuggestion(values)
    });
  }

  const data = await response.json();
  const text =
    data.output_text ??
    data.output?.flatMap((item: { content?: Array<{ text?: string }> }) =>
      item.content?.map((content) => content.text).filter(Boolean) ?? []
    ).join("\n") ??
    fallbackSuggestion(values);

  return NextResponse.json({ text });
}

function fallbackSuggestion(values: Record<string, unknown> | null) {
  const platform = String(values?.platform ?? "Instagram");
  const title = String(values?.title ?? "nova objava");

  return `Predlog za ${platform}

Ritem:
Za fotografski studio je dobra osnova 3 objave na teden: ena zgodba/proces, ena končna galerija, ena prodajna ali edukativna objava. Story lahko gre bolj pogosto, 4-6x na teden.

Zapis:
${title}

Nekateri dnevi ostanejo v spominu po svetlobi, drugi po občutku. Ta zgodba ima oboje: nežne trenutke, iskrene poglede in tisto mirno lepoto, ki jo želiš shraniti za vedno.

Če si želiš fotografiranja v podobnem občutku, mi piši in skupaj najdemo termin.

CTA:
Rezervacije in vprašanja v DM ali preko spletne strani.

Hashtagi:
#inneastudio #fotografiranje #porocnifotograf #slovenskifotograf #portret #weddingphotography #druzinskofotografiranje #brandingfotografiranje #fotografslovenija #lovestory`;
}

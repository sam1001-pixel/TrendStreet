import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { settingsFromDb, settingsToDb } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    return NextResponse.json({ settings: settingsFromDb(row) });
  } catch (err) {
    console.error("[Admin settings]:", err);
    return NextResponse.json({ error: "Could not load settings." }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const incoming = settingsToDb(await req.json());
    const data = Object.fromEntries(Object.entries(incoming).filter(([, v]) => v !== undefined));
    const before = await prisma.siteSettings.findUnique({ where: { id: "global" } });

    const row = await prisma.siteSettings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", heroSubtitle: "", ...data },
    });

    const changed = Object.keys(data).filter(
      (k) => JSON.stringify((before as Record<string, unknown> | null)?.[k]) !== JSON.stringify((data as Record<string, unknown>)[k])
    );
    if (changed.length) {
      await writeAudit(req, {
        action: "SETTINGS_CHANGE",
        entityType: "SiteSettings",
        entityId: "global",
        metadata: { changed: Object.fromEntries(changed.map((k) => [k, { from: (before as any)?.[k], to: (data as any)[k] }])) },
      });
    }

    return NextResponse.json({ settings: settingsFromDb(row) });
  } catch (err) {
    console.error("[Admin settings save]:", err);
    return NextResponse.json({ error: "Could not save settings." }, { status: 503 });
  }
}

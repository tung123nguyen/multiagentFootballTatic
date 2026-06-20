import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Tactic } from "@/lib/types";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "tactics.json");

async function readAll(): Promise<Tactic[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const list = JSON.parse(raw) as Tactic[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeAll(list: Tactic[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function GET() {
  const list = await readAll();
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  let body: Tactic;
  try {
    body = (await req.json()) as Tactic;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || !body.id || !Array.isArray(body.players)) {
    return NextResponse.json({ error: "Missing tactic data" }, { status: 400 });
  }

  const list = await readAll();
  const idx = list.findIndex((t) => t.id === body.id);
  const saved: Tactic = { ...body, updatedAt: Date.now() };
  if (idx >= 0) list[idx] = saved;
  else list.push(saved);
  await writeAll(list);

  return NextResponse.json(saved);
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const list = (await readAll()).filter((t) => t.id !== id);
  await writeAll(list);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';

// GET /api/calendar/holidays?year=YYYY
// Proxies the Calendar page's public-holiday data. Two sources are implemented below —
// exactly ONE call is active at a time. To switch source, comment the active line and
// uncomment the other one, nothing else needs to change.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  try {
    const holidays = await getHolidaysFromOracleBridge(year);
    // const holidays = await getHolidaysFromPublicApi(year);

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// ── Source 1: tabel internal EIS.LIBUR_NASIONAL (AKTIF sekarang) ───────────────────
// Lewat "oracle-bridge" — service PHP+OCI8 kecil punya wiwokdetok sendiri (folder
// oracle-bridge/ di repo ini), terpisah total dari civitas. Oracle kampus butuh mode
// Thick (Instant Client asli) — node-oracledb Thin mode gak didukung server-nya
// (NJS-138), jadi query Oracle-nya ditaruh di bridge PHP, Next.js cuma fetch JSON.
async function getHolidaysFromOracleBridge(year: number) {
  const bridgeUrl = process.env.ORACLE_BRIDGE_URL || 'http://localhost:9010';
  const bridgeKey = process.env.ORACLE_BRIDGE_KEY || '';

  const response = await fetch(`${bridgeUrl}/libur-nasional?tahun=${year}`, {
    headers: { 'X-Bridge-Key': bridgeKey },
  });

  if (!response.ok) {
    throw new Error(`Oracle bridge responded ${response.status}`);
  }

  const data: { date: string; name: string }[] = await response.json();
  return data.map((h) => ({ date: h.date, localName: h.name, name: h.name }));
}

// ── Source 2: API publik Nager.Date (NONAKTIF) ──────────────────────────────────────
// Sumber lama sebelum disambungin ke tabel internal. Uncomment call-nya di atas
// (dan comment source 1) buat balik pakai ini.
async function getHolidaysFromPublicApi(year: number) {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
  if (!response.ok) return [];
  return await response.json();
}

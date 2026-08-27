# oracle-bridge

Jembatan privat wiwokdetok ke Oracle kampus (schema `EIS`) — service PHP+OCI8 kecil,
**terpisah total dari `service-civitas`** (repo/container beda), cuma dipakai project
ini sendiri. Konteks lengkap kenapa ada ini: lihat `history_activity.md` tag
`[wiwokdetok]` sekitar tanggal dibuatnya.

## Kenapa gak langsung dari Next.js (Node)?

Oracle kampus versinya gak didukung `node-oracledb` mode Thin (pure-JS) — error
`NJS-138: connections to this database server version are not supported by
node-oracledb in Thin mode`. Wajib mode Thick (Instant Client asli), sama seperti
kenapa `service-civitas` (PHP) juga wajib pakai OCI8 + Instant Client. Daripada
gotak-gotak bikin Thick mode jalan di Node (butuh Instant Client Windows buat lokal +
ganti base image Docker buat server), lebih simpel bikin bridge PHP kecil yang reuse
resep OCI8 yang udah proven jalan di `service-civitas`.

## Setup lokal

1. Copy Oracle Instant Client Linux x64 (basic + sdk) dari `service-civitas` ke
   `oracle-instanclient/` di folder ini (nama file harus match pattern
   `instantclient-{basic,sdk}*-linux.x64-19*.zip`). Sengaja gak di-commit (gitignored,
   ~77MB) — tinggal copy dari `D:\micro_service_polibatam\civitas-dev-fresh\oracle-instanclient\`
   atau `D:\polibatam-service-civitas\oracle-instanclient\`.
2. `cp .env.example .env`, isi `ORACLE_USER`/`ORACLE_PASS`/`ORACLE_DSN` (sama kredensial
   yang dipakai civitas) + `BRIDGE_API_KEY` (generate sendiri, `openssl rand -hex 32`).
3. `docker compose up -d --build` — build OCI8 (~2-3 menit sesuai referensi civitas,
   bukan compile dari nol tiap kali).
4. Test: `curl -H "X-Bridge-Key: <isi BRIDGE_API_KEY>" "http://localhost:9010/libur-nasional?tahun=2026"`
5. Di `.env` wiwokdetok (repo utama), set `ORACLE_BRIDGE_URL=http://127.0.0.1:9010` dan
   `ORACLE_BRIDGE_KEY=<isi BRIDGE_API_KEY yang sama>`. **Pakai `127.0.0.1`, bukan
   `localhost`** — Node resolve `localhost` ke `::1` (IPv6) duluan, tapi port bridge
   cuma dipublish di `127.0.0.1` (IPv4) lewat Docker, jadi connection refused kalau pakai
   `localhost`.

## Endpoint

- `GET /libur-nasional?tahun=YYYY` — header wajib `X-Bridge-Key: <BRIDGE_API_KEY>`.
  Return `[{ "date": "YYYY-MM-DD", "name": "..." }, ...]` dari `EIS.LIBUR_NASIONAL`.

## Kalau nanti mau deploy ke server-brian

Belum di-deploy (scope awal cuma lokal). Kalau nanti mau naik: tambah service ini ke
`docker-compose.server.yml` di root repo, join `wiwok-net` (jangan publish port ke luar,
sama pola kayak `civitas-dev`), `wiwok-app` akses via `http://oracle-bridge:8080`.

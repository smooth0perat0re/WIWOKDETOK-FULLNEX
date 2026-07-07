# DEPLOY-SERVER-BRIAN.md — Handoff Deploy WIWOKDETOK-FULLNEX ke server-brian

**Dibuat:** 2026-07-07, hasil sesi analisis di workspace SoB (`e:\SonOfBrian`).
**Cara pakai:** buka Claude Code di workspace ini (`D:\wiwokdetok-fullnex`), lalu bilang **"gass, deploy"** — dokumen ini berisi semua konteks, keputusan, fakta terverifikasi, dan rencana eksekusi step-by-step. Kalau ada yang berubah sejak 2026-07-07, verifikasi ulang bagian "Fakta terverifikasi" dulu.

---

## 1. Konteks & keputusan (riwayat diskusi 2026-07-07)

- Feby punya dua versi tracker: `D:\WIWOKDETOK` (Next FE + PHP Slim BE, schema SQL drift dari kode) dan `D:\wiwokdetok-fullnex` (full Next.js). **Diputuskan pakai fullnex** — 2 container vs 3, satu origin tanpa CORS, satu repo, schema Prisma sinkron dengan kode.
- Tujuan: tracker **personal dulu** di server-brian (fase dev/testing). Kalau sudah pakem → minta VPS ke admin jaringan kantor → dipakai satu kantor + sosialisasi.
- **Login TETAP via API LDAP/Civitas** (identitas enterprise Polibatam) — JANGAN diganti local login.
- **Keputusan auth "jalur A":** pakai **instance civitas-dev sendiri di server-brian** (kopian dari `D:\polibatam-service-civitas`), BUKAN Civitas production — karena API key dev `febrian/12345` terverifikasi DITOLAK production ("Invalid API key") dan Feby belum mau minta key production. Feby sudah menyatakan **comfortable & authorized** menjalankan civitas-dev + kredensial Oracle/LDAP kantor di server pribadinya.
- **DB Postgres ikut di server** (container `wiwok-db`) — DB di PC ini statusnya jadi DB development doang. Data dev bisa dibawa via `pg_dump` (opsional, tanya Feby).
- Alur kerja git-based: develop di PC → push GitHub → pull + rebuild di server.
- Nanti (Fase 2 project SoB, dikerjakan dari workspace `e:\SonOfBrian`): bot WhatsApp SoB nge-drive tracker ini via REST + Bearer JWT.

## 2. Fakta terverifikasi (2026-07-07, dari server-brian langsung)

| Fakta | Nilai |
|---|---|
| Server | `heathcliff01@10.13.8.86` (SSH key-auth dari PC ini, `BatchMode` jalan). Ubuntu 24.04, i5-4590 4C, RAM 16GB (±14GB free), Docker 29 + Compose v5, user di grup `docker` |
| sudo | **Butuh password** (bukan NOPASSWD) — untuk operasi root pakai trik container (contoh: `docker run --rm -v /data:/mnt alpine sh -c '...'`) |
| Container existing | `orcaone-app-1` (:8080) + `orcaone-db-1` (**PRODUKSI ORANG — JANGAN DISENTUH**), `sob-app` (tanpa port publish), `9router` (:20128) |
| Port bebas | Yang kepakai cuma 8080 & 20128. Saran: `wiwok-app` → host **20130** |
| `/data` (HDD 1TB) | Owner `mentor:mentor` — heathcliff01 gak bisa nulis langsung, pakai trik docker. Sudah ada `/data/backups/sob/` (pola backup harian SoB, cron 03:30, script `~/son-of-brian/backup.sh`) |
| Oracle kampus | `192.168.5.253:1521` **REACHABLE dari server-brian** (jaringan rumah tersambung jaringan kampus, route via gateway `10.13.8.254`) |
| LDAP kampus | `192.168.5.17:389` **REACHABLE dari server-brian** |
| Civitas production | `https://service.polibatam.ac.id/civitas/api/ping` → `{"status":true}` reachable, TAPI key `febrian/12345` DITOLAK (`Invalid API key`; dobel bukti basic-auth `/docs` 401) |
| CDN kantor | `https://service.polibatam.ac.id/cdn/api/ping` → OK (dipakai `src/app/api/upload/route.ts`, hardcoded — biarkan) |
| Repo ini | `github.com/smooth0perat0re/WIWOKDETOK-FULLNEX`, branch **`proto1-fullnex`**, clean & ter-push per 2026-07-07 |
| Kopian civitas | `D:\polibatam-service-civitas` — snapshot **18+ commit di belakang** `ichwanrizky/polibatam-service-civitas` master. Endpoint login di kopian ini masih `/api/login-staff` + kanonikalisasi HMAC lama = **persis yang di-hardcode `src/app/api/login/route.ts` & `src/lib/hmac.ts` → ZERO perubahan kode fullnex** |
| Oracle Instant Client | Sudah ada: `D:\polibatam-service-civitas\oracle-instanclient\instantclient-{basic,sdk}-linux.x64-19.28.zip` (75MB total) |
| Node di container SoB | Node 24 tersedia sebagai referensi; fullnex butuh Node ≥22.13 (pakai base `node:24-alpine`) |

## 3. Arsitektur target

```
[Feby via Tailscale/LAN] ──> wiwok-app :20130 (Next.js FE+BE, standalone) ──┬──> wiwok-db (postgres:16-alpine, internal only)
                                   │ (hanya saat login)                     │
                                   └──> civitas-dev :8081 internal ─────────┴──> Oracle 192.168.5.253 & LDAP 192.168.5.17 (kampus)
[sob-app] ──(Fase 2 nanti, REST + JWT)──> wiwok-app
```
- Satu docker network shared (mis. `wiwok-net`) supaya `wiwok-app` manggil `http://civitas-dev:8081` tanpa expose port.
- `civitas-dev` TIDAK publish port ke LAN (bawa kredensial enterprise); kalau perlu debug, publish ke `127.0.0.1:9003` di server saja.
- Tidak ada port yang di-expose ke internet publik — akses hanya LAN/Tailscale (aturan yang sama dengan SoB).

## 4. Rencana eksekusi ("gass, deploy" mulai dari sini)

### Step 0 — Preflight
- `ssh heathcliff01@10.13.8.86 "docker ps"` → pastikan orcaone/sob/9router sehat, port 20130 & 9003 belum kepakai.
- Cek disk: `df -h /` (butuh beberapa GB buat build).

### Step 1 — civitas-dev di server
1. `rsync -a` folder `D:\polibatam-service-civitas\` → server `~/civitas-dev/` (termasuk `oracle-instanclient/*.zip` dan `.env`).
2. Sesuaikan di server (JANGAN ubah kopian di PC): `docker-compose.yml` → `container_name: civitas-dev`, network `wiwok-net` (external), port hanya `127.0.0.1:9003:8081` (debug) atau tanpa port sama sekali. `.env` → pastikan `HMAC_CLIENTS` berisi `{"febrian":{"secret":"12345","ips":["*"],"routes":["*"]}}` (persis format aslinya), Oracle/LDAP biarkan.
3. `docker network create wiwok-net` (sekali).
4. `docker compose up -d --build` — **build 15–30+ menit** (compile OCI8 di i5-4590, sekali doang). Jalankan via `run_in_background`/`nohup`, jangan nunggu sinkron.
5. Test dari dalam network: `docker run --rm --network wiwok-net curlimages/curl -s http://civitas-dev:8081/api/ping` → harus `{"status":true}`.

### Step 2 — Siapkan fullnex di repo ini (branch `proto1-fullnex`)
1. `next.config.ts`: tambah `output: 'standalone'`.
2. Buat `Dockerfile` multi-stage (base `node:24-alpine`): deps (`npm ci`) → `npx prisma generate` (client ke `src/generated/prisma`) → `npm run build` → runtime copy `.next/standalone` + `.next/static` + `public`. `pg` & `bcryptjs` pure-JS, aman di alpine.
3. Buat `.dockerignore` (`node_modules`, `.next`, `.git`, `.env*`).
4. Buat `docker-compose.server.yml`: service `wiwok-app` (port `20130:3000`, `env_file: .env.server`, network `wiwok-net`, `restart: unless-stopped`) + `wiwok-db` (`postgres:16-alpine`, volume named di SSD — **JANGAN di `/data`/HDD**, tanpa publish port, network `wiwok-net`).
5. Buat `.env.server.example` (template tanpa secret) — `.env.server` asli TIDAK di-commit.
6. Commit + push ke `proto1-fullnex`.

### Step 3 — Kode ke server (git-based)
- Bikin SSH deploy key di server (`ssh-keygen`) → tambahkan sebagai read-only Deploy Key di repo GitHub (Feby yang klik, atau via `gh` CLI di PC ini yang sudah login `smooth0perat0re`).
- `git clone -b proto1-fullnex git@github.com:smooth0perat0re/WIWOKDETOK-FULLNEX.git ~/wiwokdetok` di server.
- (Fallback kalau ribet: `rsync` dari PC, tapi git-based lebih rapi buat update ke depannya.)

### Step 4 — `.env.server` di server (~/wiwokdetok/.env.server)
```
DATABASE_URL=postgresql://wiwok:<password-baru>@wiwok-db:5432/wiwokdetok?schema=public
JWT_SECRET_KEY=<hasil `openssl rand -hex 32` — WAJIB baru, jangan fallback hardcode>
EXTERNAL_AUTH_API_URL=http://civitas-dev:8081
EXTERNAL_AUTH_API_KEY=febrian
EXTERNAL_AUTH_API_SECRET=12345
```
Password postgres `wiwok-db` juga di-set via env compose, samakan.

### Step 5 — DB & app
1. `docker compose -f docker-compose.server.yml up -d wiwok-db`.
2. Bootstrap schema (sekali): jalankan `npx prisma db push` dari container build/one-off dengan `DATABASE_URL` di atas (tidak ada folder migrations — memang by design, schema hasil introspect).
3. (Opsional, tanya Feby) migrasi data dev: `pg_dump` dari Postgres PC → restore ke `wiwok-db`.
4. `docker compose -f docker-compose.server.yml up -d wiwok-app`.

### Step 6 — Verifikasi end-to-end
1. `curl http://localhost:20130` dari server → FE kebuka (redirect `/workspaces`).
2. Dari browser PC/HP via LAN/Tailscale: `http://10.13.8.86:20130` → halaman login → **login pakai akun LDAP asli Feby** → auto-register + "My Personal Space" kebentuk.
3. Bikin 1 task via UI, cek muncul di DB (`docker exec wiwok-db psql -U wiwok -d wiwokdetok -c "select id,title,status from tasks;"`).
4. Smoke test API (jalur yang nanti dipakai SoB): login via `curl` → dapat JWT → `GET /api/workspaces` pakai `Authorization: Bearer`.

### Step 7 — Backup (WAJIB sebelum dianggap selesai)
- Ikuti pola `~/son-of-brian/backup.sh` di server: bikin `~/wiwokdetok/backup.sh` — `pg_dump` `wiwok-db` (via `docker exec`) + `.env.server` + `~/civitas-dev/.env` → tar.gz ke `/data/backups/wiwok/` (bikin foldernya via trik docker+chown 1000, chmod 700, umask 077), rotasi 14 arsip, cron harian (mis. 03:45, jangan tabrakan dengan 03:30 punya SoB).

### Step 8 — Laporan balik
- Catat hasil (port final, path, tanggal live) di bagian **Log Eksekusi** di bawah dokumen ini.
- Kabari: PRD project SoB (`e:\SonOfBrian\PRD.md`) perlu di-update dari workspace SoB bahwa tracker sudah live (prasyarat Fase 2 terpenuhi).

## 5. Aturan keras server-brian (WAJIB PATUH)

1. **JANGAN sentuh/restart `orcaone-app-1` & `orcaone-db-1`** — produksi projekan eksternal. Jangan restart docker daemon, jangan reboot (reboot hanya keputusan Feby).
2. Jangan expose port ke internet publik. Akses hanya LAN/Tailscale.
3. sudo butuh password → operasi root via container. `/data` (HDD) hanya untuk backup/data-boleh-hilang; data hidup (DB, volume) di SSD.
4. Jangan commit secret. `.env` repo ini sudah terlanjur ada di working tree (dev creds doang) — sebelum fase VPS kantor, wajib scrub dari git history + rotasi.

## 6. Roadmap setelah live

- **Fase 2 SoB** (dari workspace `e:\SonOfBrian`): tool function-calling bot WA → REST API tracker. Butuh jalur auth bot (JWT long-lived / API-key guard). Ingat: task gak bisa `done` tanpa review `approved` (`src/app/api/tasks/[task_id]/status/route.ts`) — dilonggarin atau bot ikut alur review, keputusan Feby.
- **Naik VPS kantor** (kalau sudah pakem): minta API key production Civitas ke pengelola (`ichwanrizky`), idealnya scoped `routes: ["/api/auth/login-staff"]`; ubah path login 1 baris (`/api/login-staff` → `/api/auth/login-staff`, endpoint production sudah pindah; kanonikalisasi HMAC baru tetap kompatibel dengan `src/lib/hmac.ts`); scrub secrets dari git history; matikan/ganti civitas-dev.

## 7. Log Eksekusi

**Deploy 2026-07-07 (Claude Code, sesi "gas deploy") — LIVE ✅**

- **Step 0 Preflight:** orcaone/sob/9router sehat, disk `/` 38G free, port 20130 & 9003 bebas.
- **Step 1 civitas-dev:** kopian `D:\polibatam-service-civitas` di-transfer via tar-over-ssh (rsync tidak ada di PC) → `~/civitas-dev/`. Compose di server disesuaikan: `container_name: civitas-dev`, port hanya `127.0.0.1:9003:8081`, network `wiwok-net` (external, dibuat sekali). Build cepat (~2 menit, bukan 15–30). Ping internal `http://civitas-dev:8081/api/ping` → `{"status":true,"message":"OK"}`.
- **Step 2 fullnex:** `output: 'standalone'` di `next.config.ts`, `Dockerfile` multi-stage `node:24-alpine`, `.dockerignore`, `docker-compose.server.yml`, `.env.server.example` (+ exception `!.env.server.example` di `.gitignore`). Commit `351b3be` di `proto1-fullnex`.
- **Step 3 git:** deploy key ed25519 dibuat di server (`~/.ssh/wiwok_deploy`), terdaftar read-only di repo (ID 156547855) via `gh`. Clone pakai alias SSH `github.com-wiwok` → `~/wiwokdetok`.
- **Step 4 env:** `~/wiwokdetok/.env.server` (chmod 600) — password Postgres & `JWT_SECRET_KEY` di-generate baru via `openssl rand -hex`. Berisi juga `POSTGRES_*` untuk container db.
- **Step 5 DB & app:** `wiwok-db` (postgres:16-alpine, volume named `wiwokdetok_wiwok-db-data` di SSD, tanpa publish port) up; schema di-push via one-off container image builder (`npx prisma db push`, catatan: flag `--skip-generate` sudah tidak ada di Prisma 7); `wiwok-app` up di **:20130**.
- **Step 6 verifikasi:** `/` → 307 `/workspaces`, `/login` 200, dari LAN PC `http://10.13.8.86:20130` OK. Smoke test auth chain: POST `/api/login` kredensial dummy → **401 `User not found` dari LDAP kampus via civitas-dev** (rantai app→civitas→LDAP terbukti nyambung). 17 tabel terbentuk di DB. `/api/workspaces` tanpa token → 401. **Belum:** login LDAP asli + bikin task via UI — perlu Feby login sendiri di browser.
- **Step 7 backup:** `~/wiwokdetok/backup.sh` (pg_dump wiwok-db + `.env.server` + `.env` civitas → `/data/backups/wiwok/`, rotasi 14, folder dibuat via trik docker chown 1000 chmod 700). Cron `45 3 * * *` terpasang, test run manual OK, dan cron sempat jalan sendiri jam 03:45 → arsip kebentuk.
- **Data dev PC:** TIDAK dimigrasi (opsional per rencana) — kalau mau, `pg_dump` dari Postgres PC → restore ke `wiwok-db`.
- **Follow-up:** (1) Feby login LDAP asli di `http://10.13.8.86:20130` untuk verifikasi final + auto-register; (2) update `e:\SonOfBrian\PRD.md` dari workspace SoB bahwa tracker live (prasyarat Fase 2); (3) sebelum fase VPS kantor: scrub `.env` dari git history + rotasi secret (aturan §5.4).

| Item | Nilai |
|---|---|
| URL | `http://10.13.8.86:20130` (LAN/Tailscale only) |
| Path server | app `~/wiwokdetok`, civitas `~/civitas-dev`, backup `/data/backups/wiwok/` |
| Container | `wiwok-app` (:20130), `wiwok-db` (internal), `civitas-dev` (127.0.0.1:9003 debug) — semua network `wiwok-net`, `restart: unless-stopped` |
| Update ke depan | push ke `proto1-fullnex` → di server: `cd ~/wiwokdetok && git pull && docker compose -f docker-compose.server.yml up -d --build wiwok-app` |
| Tanggal live | 2026-07-07 |

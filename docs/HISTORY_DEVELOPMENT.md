# WIWOKDETOK - History & Development Log

*Dokumen ini adalah *Living Document* yang berisi rekam jejak pengembangan, arsitektur, rintangan (obstacles), dan status terkini dari WIWOKDETOK. Dokumen ini wajib dibaca pertama kali oleh AI jika terjadi reset *context window*.*

## 1. Project Overview & Stack
- **Nama Project**: WIWOKDETOK (Workflow Internal Workspace Optimalisasi Kerja Dengan Efektif Tracking Organisasi Karyawan)
- **Visi**: Aplikasi Project Management Enterprise (kombinasi UI/UX Plane.so dan Fungsionalitas Notion).
- **Backend Stack**: PHP 8.3 (Slim Framework 4), PostgreSQL 15, Firebase PHP-JWT.
- **Frontend Stack**: Next.js 16 (App Router), TailwindCSS, React Query, Zustand, Next-Themes.
- **Infrastruktur**: Docker & Docker Compose.

---

## 2. Arsitektur Keamanan & Database
- **Backend Security**: Menggunakan `AuthMiddleware` (validasi JWT) dan `HmacMiddleware` (validasi X-API-KEY, X-TIMESTAMP, X-SIGNATURE) untuk rute M2M (Machine-to-Machine) seperti integrasi osTicket.
- **Database Schema**: 
  - `workspaces` (Private/Public) & `workspace_members`
  - `projects`
  - `tasks` (Punya flow status ketat: backlog -> in_progress -> in_review -> done/not_passed)
  - `task_links` (Traceability: related, blocks, dll)
  - `task_reviews` (Wajib ada reviewer untuk memindahkan task ke status *done*).

---

## 3. History Pengembangan Terkini

### Tahap Sebelumnya (Mencapai "Cangkang" MVP)
- Backend API berhasil diatur menjadi arsitektur MVC.
- Skema database lengkap sudah diaplikasikan.
- Frontend Next.js diinisialisasi dengan *Dark Mode* (next-themes) dan komponen UI dasar (Kanban board statis).

### Iterasi 1 (Fokus Saat Ini: Menghidupkan MVP Frontend)
**Obstacles (Rintangan) & Kondisi Saat Ini:**
- ⚠️ **Kesenjangan FE & BE**: Backend sudah siap untuk MVP, tapi Frontend masih berupa "Cangkang Visual" (Mockup).
- ⚠️ **Login Bypass (Temporary Hack)**: Karena sedang fokus membangun UI Kanban tanpa terblokir sistem autentikasi JWT, sistem login di- *bypass*. 
  - `next.config.ts` diubah untuk me-redirect `/login` dan `/` langsung ke `/workspaces`.
  - Redirect otomatis ke halaman login pada error 401 di `src/lib/api.ts` di- *comment-out* sementara.
- ⚠️ **Missing UI Components**: Form/Modal untuk membuat Workspace, Project, dan Task belum ada. Fungsi *Drag and Drop* belum diimplementasikan dengan `dnd-kit`. Tidak ada UI untuk mengundang anggota, me-link task, atau sistem Review (Approve/Reject).

**Roadmap Penyelesaian Iterasi 1:**
- ✅ **Phase 1**: Membangun Foundation Modals (Create Workspace & Project) + Form Validation (React Hook Form + Zod).
- ✅ **Phase 2**: Mengimplementasikan *Drag & Drop* murni menggunakan `@dnd-kit/core` pada papan Kanban. Menyinkronkannya dengan API `updateStatus`.
- ✅ **Phase 3**: Membangun UI Task Creation & Task Detail (Integrasi osTicket). Plane-style Side Panel & `@uiw/react-md-editor` untuk markdown rendering.
- ✅ **Phase 4**: Membangun UI Review System (Pilih reviewer saat masuk ke *In Review*, UI Approve/Reject) dan Traceability/Linking.

**Bug Fixes & Technical Decisions Terkini:**
- Backend `JwtAuthMiddleware.php` bypass (sebelumnya `user_id = 1`) telah **DIHAPUS** / disesuaikan kembali ke alur *Login* yang sebenarnya menggunakan JWT.
- Di `ProjectController.php` dan `TaskController.php`, telah dibuat *handling* otomatis konversi `workspaceSlug` (string) menjadi `workspace_id` (integer) sebelum menyentuh PostgreSQL agar mencegah *Internal Server Error 500*.
- Error `params` Next.js 15+ di-*resolve* dengan membungkus parameter ke dalam asinkron `use(params)` di halaman yang bermasalah.

### Iterasi 2 (Integrasi Autentikasi Eksternal - LDAP/Civitas)
**Progress Selesai:**
- ✅ Integrasi sistem Autentikasi (Login) dengan API Eksternal (`polibatam-service-civitas`) yang berbasis LDAP/Oracle menggunakan standar **HMAC SHA256 Signature**.
- ✅ Pembuatan *utility* `HmacClient` di backend yang mereplikasi secara persis format enkripsi (`METHOD + PATH + TIMESTAMP + BODY_HASH`) untuk menembus `HmacMiddleware` civitas.
- ✅ Implementasi **Auto-Registration**: Jika *user* berhasil divalidasi oleh API Civitas, *backend* kita akan otomatis membuatkan *record* di database PostgreSQL lokal (tabel `users`) dan menerbitkan JWT lokal untuk menjaga fungsionalitas UI.
- ✅ Perombakan antarmuka halaman login Next.js dari input *Email* menjadi *Username / NIP / NIM*.

**Obstacles (Rintangan) yang Dialami & Telah Diselesaikan:**
- 🐛 **Frontend Black Screen & Hang:** Fitur *Auth Guard* di `layout.tsx` sempat me-*return* `null` saat user belum login, yang membuat navigasi Next.js *macet* dan melahirkan layar hitam abadi. **(Fixed)** dengan memunculkan animasi *loading* sesaat dan mengganti metode *redirect* menjadi `window.location.href = '/login'`.
- 🐛 **Infinite Redirect Loop:** Adanya sisa kode masa *development* di `next.config.ts` yang memaksa `/login` selalu berbelok ke `/workspaces`, sedangkan sistem keamanan *guard* memaksa sebaliknya. **(Fixed)** dengan menghapus *bypass* lama di `next.config.ts`.
- 🐛 **Docker Networking (Connection Refused):** API Civitas berjalan di `localhost:9003` mesin Windows (Host), namun *backend* kita berjalan di dalam Docker. Konfigurasi awal `localhost` membuat kontainer mencari API di badannya sendiri dan gagal. **(Fixed)** dengan menggunakan `host.docker.internal:9003` di file `.env`.
- 🐛 **Fatal Error 500 & Recursion di Backend:** Library `vlucas/phpdotenv` tidak diinisialisasi di `index.php`. Akibatnya, `EXTERNAL_AUTH_API_URL` kosong dan memicu sistem me-*request* `/api/login-staff` ke *dirinya sendiri* (`localhost:8000`). Hal ini berujung kembalian *error HTML 404* yang merusak fungsi `json_decode`, membuat server *crash* 500. **(Fixed)** dengan menambahkan `$dotenv->safeLoad()` di `index.php`, mengubah gaya baca ke `$_ENV`, serta membentengi fungsi `AuthController.php` dari respons non-JSON.

### Iterasi 3 (Penyempurnaan UI, Dynamic Dashboard & Manajemen Member Project)
**Progress Selesai:**
- ✅ **Sidebar & Header UI Polish**: Melakukan *rebranding* teks sidebar dari sekadar "Workspace" menjadi "WIWOKDETOK". Menyederhanakan header/breadcrumb untuk menghilangkan gaya tampilan yang inkonsisten (seperti format *nama/dashboard*) agar lebih rapi ("Home & Dashboard").
- ✅ **Dynamic Workspace Overview**: Menghapus data *dummy/hardcoded* pada halaman *Overview Workspaces*. Angka metrik (contoh: Total Project, Total Task, dsb) kini dihubungkan secara langsung ke *query backend* dan menampilkan *real data* dari PostgreSQL.
- ✅ **Project Members Management**: Menambahkan tingkat granularitas baru dalam keanggotaan. Selain *Workspace Members*, sebuah Project kini dapat memiliki alokasi anggota/membernya sendiri, memudahkan pemisahan akses yang lebih mendetail di tingkat Project.
- ✅ **Task Linking**: Pengembangan fungsionalitas UI modal *Link Task* terus berjalan untuk memperkuat *traceability* antar *tasks*.
- ✅ **What has been done... UI**: Mengubah layout *Home Dashboard* dan *Project Board* untuk mengakomodasi panel "What has been done" di sisi kanan. Komponen ini menampilkan secara spesifik daftar *task* apa saja yang berhasil diselesaikan (*Done*) dalam kurun waktu satu minggu, lengkap dengan tanggal penyelesaiannya.
- ✅ **Project Notes & CDN Integration**: Menambahkan fitur **Notes** eksklusif pada halaman *Project Board*. Fitur ini dirender berdampingan (secara vertikal) dalam satu panel yang sama dengan widget *What has been done*. Mendukung unggah lampiran gambar secara langsung dengan menembak API CDN Polibatam (`service.polibatam.ac.id/cdn/api/upload`) tanpa autentikasi, yang kemudian path gambar dari CDN disimpan di database PostgreSQL lokal.
- ✅ **Headline Bumper & Jadwal Sholat**: Merombak tampilan *top navbar* menjadi *Bumper* statis bergaya "Headline News" dengan animasi mengetik (*typing animation*) yang mulus dari 0-100% menggunakan teknik invisible text. Di sebelah kanan tersemat widget Jam yang terintegrasi otomatis dengan **MyQuran API** (Kemenag RI) untuk menarik *real-time* data Jadwal Sholat khusus wilayah Batam (ditampilkan dalam pop-up mengapung ber-z-index tinggi). Komponen *breadcrumbs menu path* dipisahkan dari navbar agar menyatu dan ikut ter-scroll secara alami dengan konten halaman (*floating*).
- ✅ **Project Board UI Polish & Custom Icons**: Menyempurnakan antarmuka pengaturan Project dengan badge warna dinamis penanda status (Merah/Hijau/Oranye), serta menambahkan fungsionalitas pemilih emotikon dinamis (*bullet icon*) secara spesifik untuk identitas ikon masing-masing task di halaman Project Board.
- ✅ **Task Properties & Chained Tickets**: Memperluas kapabilitas panel Task Detail (Side Panel) dengan memperhalus z-index agar memblokir seluruh *background*, meratakan header yang simetris, mengakomodasi properti baru *Chained Tickets* (referensi cross-ticket eksternal/URL) dan implementasi manajemen multi-label **Tags** yang terintegrasi penuh ke database backend.
- ✅ **Task Notes Widget (Chat-like Interface)**: Menginisiasi fitur "Notes" di Side Panel task dengan pendekatan antarmuka obrolan (*bubble-style chat history*). Mendukung *seamless experience* dengan fitur *native clipboard paste* untuk langsung mendeteksi dan mengkonversi *base64 images* saat pengguna menekan CTRL+V di area input komentar. 
- ✅ **Global Performance & UI/UX Loading Optimization**: Menerapkan optimisasi performa menyeluruh untuk mengatasi keluhan rendering yang *lambat* saat bernavigasi antar menu. Fitur *caching* tingkat lanjut dengan *staleTime* dan `stale-while-revalidate` dimaksimalkan pada `QueryClient` React Query. Dikombinasikan dengan arsitektur UI *non-blocking* menggunakan komponen re-usable `<LoadingSection />` (teks *pulsing*) dan `<ErrorSection />` (*Retry button*) di seluruh area utama (*Workspace Overview*, *Project Kanban*, *Members List*), sehingga menjamin transisi yang seketika tanpa layar *blank* atau data `0` yang menyesatkan.
- ✅ **Home & Dashboard Redesign**: Merombak total tata letak (*layout*) halaman Home & Dashboard agar persis mengikuti referensi desain UI/UX terbaru. Perubahan mencakup pengaturan asimetris grid CSS (2 kolom) di mana *Quicklinks* ditarik naik (*absolute positioned*) mensejajarkan diri dengan Path Menu, *Greetings* berpusat (*centered*) secara eksklusif di kolom kiri, panel *What has been done* di kolom kanan sejajar mulus horizontal dengan *Ask Work Talk AI*, penggabungan menu *Recents* dan *Sticky Notes* ke dalam format *Dropdown Pill*, serta membentangkan kotak foto *Remember what you work for* agar memenuhi seluruh lebar halaman bawah (*full-width stretch*).
- ✅ **CDN Upload Proxy & Dashboard Photos**: Menyelesaikan isu *CORS Error* saat melakukan `fetch` langsung ke server CDN Eksternal Polibatam dengan mengimplementasikan rute API *Proxy* di layer Next.js (`/api/upload`). Fitur unggah foto beresolusi tinggi pada segmen *Remember what you work for* kini sepenuhnya aktif dengan persistensi seutuhnya ke database.
- ✅ **Edit & Delete Action Hub**: Menambahkan fungsionalitas operasi Edit dan Delete secara komprehensif pada widget *Quicklinks* dan *Sticky Notes*. Pendekatan UI interaktif digunakan dengan menyembunyikan opsi ubah/hapus (ikon *Pencil* & *Trash*) sampai *user* meng-*hover* kursor mereka ke atas komponen, memaksimalkan ruang antarmuka agar tetap minimalis.
- ✅ **To-Do List (What to do..?) & Drag-and-Drop**: Menghadirkan fitur To-Do List independen (*standalone*) khusus di *Home Dashboard*. Komponen ini disatukan dengan rapi di kolom kanan (bersama *Weekly Activity Chart*) dan diganti secara dinamis (*toggle*) menggunakan *trigger Dropdown Title*. Fitur ini mendukung penyaringan (*Filter Dropdown*) berbasis Hari (Yesterday/Today/Tomorrow), pencoretan item selesai (*strikethrough*), serta yang paling canggih: penyusunan urutan prioritas melalui **Drag & Drop** persisten (terkoneksi ke indeks *position* PostgreSQL backend) bermodalkan pustaka modern `@hello-pangea/dnd`.

### Iterasi 4 (Personal Workspace & Productivity Tools)
**Progress Selesai:**
- ✅ **Personal Space & Notes (Private Data)**: Memisahkan secara tegas lingkup fungsionalitas *Shared Workspaces* dan *Personal Space*. Data ruang lingkup Personal diikat dengan flag `is_private` di database. Menghadirkan kapabilitas untuk membuat halaman khusus "Personal Notes" (`/workspaces/personal-notes`) dengan dukungan modifikasi *Icon Emoji* (*custom emote*).
- ✅ **Sidebar Layout Optimization & Reports Placeholder**: Menata ulang struktur Sidebar agar lebih terorganisir. Menambahkan fitur *Collapsible Toggles* (expand/collapse) pada setiap *Section* utama (WORKSPACES, PERSONAL SPACE, TIME MANAGEMENT, dan REPORTS) untuk menghindari tumpukan menu yang berlebihan (UI Clutter).
- ✅ **Public Calendar Integration**: Mengintegrasikan API kalender publik eksternal (`date.nager.at`) ke dalam menu **Calendar**. Kalender interaktif (menggunakan *native JS Date* murni) ini mampu menyorot (*highlight*) secara otomatis hari-hari Libur Nasional di Indonesia ke dalam antarmuka bernuansa gelap (*Dark Mode*).
- ✅ **Time Management Hub (Pomodoro & Alarm)**: Menghadirkan panel khusus produktivitas yang murni berjalan pada sisi *client* (*LocalStorage*). Pomodoro Timer disempurnakan dengan *circular progress UI*, sementara fitur Alarm dibekali *widget real-time clock* dan pemantau interval waktu presisi (`setInterval`). Semua notifikasi audio dioptimalkan menggunakan file *open-source* lokal (*self-hosted* di folder `public/sounds/`) untuk menjamin kecepatan pemutaran instan (*zero-latency playback*) tanpa *delay/buffering* saat koneksi internet lambat atau mati.
### Iterasi 5 (Restrukturisasi URL, Kalender Internal via Oracle Bridge, Polish Dashboard)
**Progress Selesai:**
- ✅ **Dashboard Photo Lightbox**: Card promo *placeholder* "Ask Work Talk AI" (tanpa fungsi nyata) dihapus, digantikan section "Remember what you work for" yang dipindah naik dari posisi *full-width* di bawah. Foto motivasi kini mendukung *hover-preview* + *pin-on-click*, ditampilkan sebagai *lightbox full-screen* (`fixed inset-0` backdrop, foto di-*portal* ke `document.body` via `createPortal`) — sempat ada bug *backdrop* menutupi *thumbnail* asalnya sendiri sehingga status *hover* nyangkut, di-*fix* dengan fungsi `close()` eksplisit + tombol X.
- ✅ **Dashboard Layout Fix**: Box *Recents* & *"What has been done...?"* diubah dari CSS Grid ke Flexbox row (`lg:w-2/3`+`lg:w-1/3`) agar reliable *stretch* mengisi tinggi *viewport* tersisa (CSS Grid *auto-row sizing* gak konsisten stretch-nya). Offset posisi *Quicklinks* (`-top-[52px]` → `-top-[44px]`) disesuaikan agar sejajar breadcrumb.
- ✅ **Bug Fix — ClockWidget & Bumper Text**: Widget jam ditambah detik (interval 1 detik) dan popup Jadwal Salat diubah jadi *hover-to-preview* + *click-to-pin* (state `isPinned`/`isHovering` terpisah). *Bumper text* di *header* yang huruf terakhirnya kepotong (`"...Apss"`) ternyata root cause dari `border-right` 2px (kursor animasi mengetik) yang termakan `box-sizing: border-box` global preflight Tailwind — *di-fix* dengan `box-sizing: content-box` khusus di class tersebut.
- ✅ **Kalender Internal (EIS.LIBUR_NASIONAL)**: Sumber data hari libur diganti dari API publik `date.nager.at` ke tabel Oracle internal kampus `EIS.LIBUR_NASIONAL` (21 baris utk 2026, lengkap termasuk cuti bersama). Karena Oracle kampus versi lama gak didukung `node-oracledb` mode Thin (`NJS-138`) dan endpoint baru sengaja **tidak** ditambahkan ke service `civitas` (dijaga privat, gak nyentuh repo bersama), dibangun service terpisah `oracle-bridge/` (PHP 8.3 + OCI8, reuse Oracle Instant Client Linux binary yang sama kayak civitas) — 1 endpoint `GET /libur-nasional?tahun=YYYY` dengan auth `X-Bridge-Key`. Route Next.js baru `/api/calendar/holidays` mem-*proxy* ke bridge ini, dengan 2 *source* (tabel internal / API publik) yang bisa di-*switch* tinggal comment/uncomment. Dijalankan sebagai container terpisah (`oracle-bridge`), join docker network `wiwok-net` yang sama, tidak di-*expose* ke LAN.
- ✅ **Restrukturisasi URL (Route Group)**: Halaman "Home & Dashboard", Calendar, Inbox, Personal Notes, dan Time Management sebelumnya semua numpang di prefix `/workspaces/...` (ikut lokasi *shared layout* sidebar+header), padahal bukan konten *workspace* tertentu. Direstruktur pakai Next.js *Route Group* `(app)` (folder gak nempel ke URL tapi tetap *share layout*) — sekarang jadi `/dashboard`, `/calendar`, `/inbox`, `/personal-notes`, `/time-management/*`; hanya halaman *workspace* beneran (`/workspaces/{slug}/...`) yang tetap pakai prefix itu. Redirect `/` diarahkan ulang ke `/dashboard`.
- ✅ **Bug Fix Susulan**: `Breadcrumbs.tsx` sempat nyangkut nampilin "DASHBOARD" di semua halaman baru (Calendar/Notes/Time Management) karena cuma punya *case* eksplisit utk `/dashboard`/`/inbox`/`/settings` — ditambah *case* utk route baru. Komponen `Modal` bersama (`src/components/ui/modal.tsx`) juga sempat bikin modal "Edit Note" kepotong (konten cuma setinggi *title*+dikit *textarea*, sisa tinggi custom modal kosong) karena *wrapper div* `{children}` gak dikasih `flex-1` — *di-fix* 1 baris, aman utk 8 modal lain yang pakai komponen sama (gak set tinggi custom).

---

## 4. Cara Menjalankan Project (How to Run)
- **Backend & Database**: `cd D:\WIWOKDETOK` -> `docker-compose up -d --build` (Berjalan di `localhost:8000`)
- **Frontend**: `cd D:\WIWOKDETOK\wiwokdetok-fe` -> `npm install` -> `npm run dev` (Berjalan di `localhost:3000`)

*Catatan: Dokumen ini harus di-update setiap kali sebuah Phase, Iterasi besar, atau perombakan arsitektur selesai dilakukan.*

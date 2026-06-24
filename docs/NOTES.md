# WIWOKDETOK - Project Log & Development Summary

*Dokumen ini merupakan rangkuman dari seluruh proses diskusi dan pengembangan aplikasi WIWOKDETOK dari awal hingga mencapai status MVP yang sepenuhnya berfungsi (Production-Ready).*

## 1. Visi Aplikasi
**WIWOKDETOK** dirancang sebagai aplikasi manajemen proyek kelas atas (*Enterprise*) yang menggabungkan elemen desain UI/UX dari **Plane.so** dan **Notion**. Aplikasi ini digunakan untuk mengelola *Workspaces*, *Projects*, dan *Tasks* dalam antarmuka Kanban yang dinamis, disertai dukungan *Dark Mode* dan kapabilitas integrasi API (Machine-to-Machine) dengan platform lain seperti *osTicket*.

## 2. Arsitektur Teknologi (Stack)
- **Frontend**: Next.js 16 (App Router), TailwindCSS, React Query, Zustand (State Management), Next-Themes (Dark Mode), Sonner (Toasts), dan Lucide React (Icons).
- **Backend**: PHP 8.3 dengan Slim Framework 4, Firebase PHP-JWT untuk autentikasi.
- **Database**: PostgreSQL 15.
- **Infrastruktur**: Docker & Docker Compose.

---

## 3. Fase Pengembangan (Phases)

### Phase 1: Backend Setup & Hardening
- Menginisialisasi *container* Docker untuk PHP/Slim dan PostgreSQL.
- Merombak struktur dasar menjadi arsitektur **MVC (Model-View-Controller)** yang rapi dengan `Routes`, `Controllers`, `Middleware`, dan `Config`.
- Menyiapkan endpoint CRUD untuk `users`, `workspaces`, `projects`, dan `tasks`.

### Phase 2: Frontend MVP Foundation
- Menginisialisasi proyek Next.js untuk antarmuka pengguna.
- Membuat fungsionalitas dasar seperti *routing* halaman `login` dan `workspaces`.

### Phase 3: Premium UI/UX Overhaul
*Pada fase ini, fokus utama adalah memberikan "Wow Factor" pada antarmuka.*
- **Global Design**: Menerapkan *Glassmorphism*, transisi mulus, dan *Dark Mode* interaktif menggunakan `next-themes`.
- **Sidebar & Layout**: Membuat navigasi *collapsible* (bisa dilipat) yang persis seperti Plane.
- **Kanban Board**: Mendesain papan tugas interaktif (*Drag & Drop* ready) dengan indikator prioritas (*Signal bars*) dan avatar pengguna.
- **State Management**: Menggunakan **Zustand** untuk mengontrol *state* autentikasi agar persisten (*sync* dengan *cookies*).

### Phase 4: Full API Integration & Enterprise Security
*Fase ini menyelesaikan integrasi end-to-end antara UI dan Database, serta memperkokoh keamanan.*
- **Backend Security Revamp**: Mengacu pada repositori *polibatam-service-civitas*, kami memasang standar keamanan tingkat tinggi:
  1. **AuthMiddleware**: Validasi HMAC-SHA256 sejati menggunakan `firebase/php-jwt`.
  2. **HmacMiddleware**: Perlindungan rute *Machine-to-Machine* (M2M) dengan `X-API-KEY`, `X-TIMESTAMP`, dan `X-SIGNATURE`.
- **Frontend API Integration**: Mengganti semua data statis (*dummy*) dengan *React Query hooks* (`useWorkspaces`, `useTasks`) yang menembak langsung ke API `localhost:8000`.
- **Bug Fixes**: 
  - Menghapus `middleware.ts` Next.js 16 yang *deprecated*.
  - Menyelesaikan konflik tumpukan *layout* Sidebar ganda.
  - Memperbaiki kegagalan Composer dalam me- *resolve* *namespace* `App\Config\Database`.
  - Memperbaiki batasan 32-byte pada kunci rahasia *Firebase JWT* yang sempat menyebabkan *Internal Server Error 500*.

---

## 4. Cara Menjalankan Proyek (How to Run)
1. **Backend (Database & API)**
   ```bash
   cd D:\WIWOKDETOK
   docker-compose up -d --build
   ```
   *Backend API berjalan di http://localhost:8000*

2. **Frontend (Next.js)**
   ```bash
   cd D:\WIWOKDETOK\wiwokdetok-fe
   npm install
   npm run dev
   ```
   *Aplikasi web berjalan di http://localhost:3000*

## 5. Kredensial Saat Ini
- **Email**: `admin@wiwokdetok.com`
- **Password**: `password123`
*(Token akan dihasilkan oleh JWT menggunakan secret key yang panjangnya >32 karakter).*

---
**Catatan untuk AI Selanjutnya:**
Aplikasi ini sudah berada di tahap MVP siap pakai. Integrasi API sudah aktif, UI sudah premium, dan pengamanan server telah menggunakan JWT + HMAC. Jika melanjutkan pengembangan, fokus dapat diarahkan pada:
1. Implementasi fungsionalitas drag-and-drop murni (dnd-kit) di Frontend Kanban.
2. Integrasi webhook/API dengan *osTicket* melalui `HmacMiddleware`.
3. Validasi *input* formulir di frontend dengan `react-hook-form` & `zod`.

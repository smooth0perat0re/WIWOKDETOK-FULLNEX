# PLANNING & FUTURE FEATURES

Dokumen ini berisi daftar ide, *roadmap*, dan fitur-fitur masa depan yang akan dikembangkan untuk WIWOKDETOK.

## 1. Spotify Radio Broadcast (WebRTC)
**Deskripsi:**
Fitur "Listen Along" ala Discord. Master/Admin dapat menyiarkan suara *desktop* (khususnya lagu Spotify yang sedang diputar di PC lokal) ke seluruh pengguna aplikasi WIWOKDETOK yang sedang *online*.

**Konsep Teknis:**
1. **Broadcaster (Master):** Menggunakan fitur *Browser Screen Share* (`navigator.mediaDevices.getDisplayMedia`) untuk menangkap jalur *System Audio*.
2. **Signaling/Server:** Mengirimkan *audio stream* ke backend/VPS (menggunakan *WebRTC SFU* seperti Mediasoup/LiveKit, atau *WebSockets*).
3. **Listener (User):** Menerima aliran suara secara *real-time*. Dilengkapi kontrol volume dan tombol *Mute/Unmute* individual.

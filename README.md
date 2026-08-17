# ☕ KOPI TUBRUK - Teka Teki Silang Smart (PWA Android App)

**KOPI TUBRUK** adalah aplikasi Teka-Teki Silang (TTS) modern, responsif, dan interaktif yang dirancang khusus untuk layar smartphone Android. Menyajikan pertanyaan berbobot di bidang Pengetahuan Umum, Sejarah & Peradaban, IPTEK, Geografi, dan Seni Budaya Nusantara.

---

## ✨ Fitur Utama

1. **Smart Ticker Kerlap-Kerlip Border:**
   - Bingkai LED glowing teranimasi di sekeliling aplikasi yang menampilkan statistik permainan dan trivia berputar.
2. **Mode Gelap (Dark Theme) & Mode Terang:**
   - Desain bertema *Espresso Dark* dan *Cream Light* yang nyaman di mata.
3. **Notifikasi Jawaban Salah Khas & Edukatif:**
   - Bila jawaban salah, muncul dialog lucu bertuliskan:  
     > **"Makanya belajar, biasakan membahas substansi."** ☕
4. **🛡️ 100% AMAN & TANPA IZIN HP (0 Permissions):**
   - Tidak memerlukan akses Kamera, Kontak, Lokasi GPS, Microphone, maupun Storage HP.
   - Kode berjalan transparan dan aman dalam sandbox web browser.
5. **📱 Progressive Web App (PWA) / Web APK:**
   - Dapat langsung di-install di layar utama (Home Screen) Android tanpa melalui Google Play Store.
6. **Eksplorasi Kategori Luas:**
   - 💡 **Pengetahuan Umum**
   - 🏛️ **Sejarah & Peradaban**
   - 🔬 **IPTEK & Digital**
   - 🌍 **Geografi & Alam**
   - 🎨 **Seni & Budaya**
7. **Suara Interaktif (Web Audio API):**
   - Efek suara ketik keyboard, buzzer jawaban salah, nada jawaban benar, dan lagu kemenangan (dapat di-mute).

---

## 🚀 Cara Menjalankan Secara Lokal

Untuk menguji aplikasi di komputer lokal:

```bash
cd /home/mkz/Dokumen/kopi-tubruk
python3 -m http.server 8080
```
Buka browser di: `http://localhost:8080`

---

## 📤 Cara Upload Repositori ke GitHub Pribadi Anda

Ikuti langkah mudah ini di terminal untuk mengunggah repositori ke GitHub:

### 1. Inisialisasi Git Lokal & Commit Pertama
```bash
cd /home/mkz/Dokumen/kopi-tubruk
git init
git add .
git commit -m "Initial commit: KOPI TUBRUK TTS Smart Android PWA App"
```

### 2. Hubungkan ke GitHub Private Repo Anda
Buat repositori baru di [GitHub](https://github.com/new) (Centang **Private**):
- Nama repositori: `kopi-tubruk`

Lalu jalankan perintah berikut di terminal (ganti `USERNAME` dan `TOKEN` dengan akun Anda):

```bash
# Tambahkan remote origin dengan Personal Access Token (PAT)
git remote add origin https://USERNAME:TOKEN@github.com/USERNAME/kopi-tubruk.git

# Set branch utama ke main
git branch -M main

# Push repositori ke GitHub
git push -u origin main
```

### 3. Agar APK / App Bisa Dilihat & Diinstal Publik Versi Live
Meskipun kode repositori di-set **Private** (hidden), Anda bisa mengaktifkan versi live publik melalui salah satu dari opsi gratis ini:

#### Opsi A: Menggunakan Vercel (Rekomendasi Tercepat)
1. Buka [Vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New Project** -> Pilih repositori **kopi-tubruk** (Private).
3. Klik **Deploy**.
4. Dalam 30 detik, Anda mendapatkan link versi live HTTPS (contoh: `https://kopi-tubruk.vercel.app`) yang bisa diakses & di-install oleh siapa saja di smartphone Android mereka!

#### Opsi B: Menggunakan Netlify
1. Buka [Netlify.com](https://netlify.com) -> Import from GitHub -> Pilih repositori `kopi-tubruk`.
2. Klik **Deploy Site**.

---

## 📜 Garansi Keamanan & Bebas Virus
Aplikasi ini dikembangkan menggunakan teknologi standar HTML5, CSS3, dan Vanilla JavaScript PWA modern tanpa dependensi berbahaya. Seluruh data disimpan lokal di peramban (localStorage) dan **sama sekali tidak mengakses API rahasia atau izin perangkat fisik**.

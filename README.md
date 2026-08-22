# KOPI TUBRUK ☕⚡

> **Real-Time Multi-Exchange Prediction Engine, AI Debate & Autonomous Fast-Flip Trading Terminal**

**KOPI TUBRUK** adalah platform pelacak harga kripto real-time berlatensi ultra-rendah dan simulator trading kontrak biner (*prediction market*) yang diselaraskan dengan standar pasar **Polymarket**. Dilengkapi dengan:

- **Multi-Exchange Live Data Aggregator**: Binance, Coinbase, Kraken, dan estimasi probabilitas implisit Polymarket.
- **Solid Dual-Clock Timer & Rollover Engine**: Hitung mundur presisi sub-detik (`MM:SS.ms`) dengan jaminan anti-freeze / anti-macet (tetap berjalan lancar di background/tab lain).
- **Dual Theme Support**: 
  - ☀️ **Versi Terang (Clean Light Mode)**: Desain finansial modern, kontras tajam, dan elegan.
  - 🌙 **Versi Gelap Ergonomis (Obsidian Slate / Deep Sapphire)**: Nyaman di mata, minim ketegangan mata saat monitoring berjam-jam.
- **Smart Dynamic Reversal & Fast-Flip Protection**:
  - Deteksi instan saat harga/momentum berbalik arah tajam melawan posisi terbuka.
  - **Jual Cepat (Emergency Fast Cut-Loss)** untuk menyelamatkan modal kas.
  - **Kalkulasi Re-Entry (Beli Ulang Arah Berlawanan)** secara matematis untuk menutup kerugian ronde pertama sekaligus menargetkan **Net Positive Profit** saat resolusi.
- **Dual-Agent AI Debate Module**: Analisis mendalam Bull AI vs Bear AI dengan sintesis Arbiter Consensus.
- **Side-by-Side Dual Charts**: Candlestick 15s (EMA 7, EMA 21, VWAP) berdampingan dengan High-Frequency Tick Stream Canvas 60 FPS.

---

## 🚀 Fitur & Peningkatan Utama

### 1. ⏱️ Solid Dual-Clock Timer (Anti-Macet)
- Menggabungkan loop *high-frequency heartbeat interval* dengan `requestAnimationFrame` visual rendering.
- Mengeliminasi pembekuan timer saat pengguna berganti tab atau meminimalkan browser.
- Otomatis melakukan *rollover* dan *settlement* posisi saat putaran mencapai `00:00.0`.

### 2. 🎨 Dual Theme Mode (Terang & Gelap Ergonomis)
- Tombol toggle ☀️ TERANG / 🌙 GELAP di bar navigasi atas.
- Preferensi tema tersimpan otomatis di `localStorage`.
- Latar belakang grafik canvas, garis grid, dan indikator teks otomatis beradaptasi dengan kontras optimal.

### 3. 🌐 Multi-Exchange Aggregator & Polymarket Standard
- Menarik WebSocket real-time dari Binance, Coinbase, Kraken, dan menghitung harga komposit terbobot (*center-weighted composite*).
- Menghitung nilai wajar kontrak biner Polymarket ($0.01 – $0.99 / 1¢ – 99¢) berbasis model *Normal CDF / Black-Scholes binary option*.

### 4. ⚡ Dynamic Reversal & Fast-Flip Strategy
- **Tahap 1 (Deteksi Reversal)**: Memantau harga terhadap strike, drawdown posisi, dan lonjakan skor agen lawan.
- **Tahap 2 (Jual Cepat / Cut Loss)**: Melikuidasi posisi rugi di harga bid/ask pasar terkini untuk menyelamatkan kas.
- **Tahap 3 (Kalkulasi Target Profit)**:
  $$\text{Required Shares} = \frac{\text{Loss Leg 1} + \text{Target Profit}}{1.00 - P_{\text{opposite}}}$$
- **Tahap 4 (Eksekusi Beli Ulang)**: Membeli lembar kontrak arah baru dan memantau target net profit hingga akhir ronde.

---

## 💻 Live Version

Akses aplikasi live: **[rabapuba.github.io/crypto-predict-ai/](https://rabapuba.github.io/crypto-predict-ai/)**

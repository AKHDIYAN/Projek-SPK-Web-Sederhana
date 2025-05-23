# 🎓 Sistem Pendukung Keputusan Pemilihan Dosen Terbaik

Aplikasi berbasis web untuk membantu proses penilaian dan pemeringkatan dosen terbaik berdasarkan berbagai indikator akademik, menggunakan metode **SAW** dan **TOPSIS**.

![GitHub Repo](https://img.shields.io/badge/GitHub-AKHDIYAN--SPK--Web--Sederhana-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-Completed-brightgreen?style=flat-square)

---

## 🔍 Fitur Utama

- 🔁 Perbandingan dua metode SPK: **SAW (Simple Additive Weighting)** dan **TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)**
- ⚖️ Pengaturan bobot kriteria secara dinamis
- 📁 Import data melalui file `.csv`, `.xlsx`, dan `.xls`
- ✍️ Input manual data dosen
- 📊 Visualisasi interaktif: Bar Chart, Radar Chart, dan Scatter (SAW vs TOPSIS)
- 💾 Simpan & muat konfigurasi bobot (dengan Local Storage)
- 🔎 Pencarian berdasarkan nama atau NIDN dan filter berdasarkan fakultas
- 📤 Ekspor hasil ranking ke file CSV

---

## 📂 Struktur Folder

```
├── index.html               # Halaman utama aplikasi
├── style.css                # Desain tampilan aplikasi
├── script.js                # Logika dan fungsionalitas SPK
├── Dataset_Dosen_sinta.csv # Contoh dataset dosen
└── assets/
    ├── preview1.png         # Screenshot halaman utama
    ├── preview2.png         # Screenshot grafik radar
    └── preview3.png         # Screenshot perbandingan metode
```

---

## 🚀 Cara Menjalankan

1. Clone repositori ini:
   ```bash
   git clone https://github.com/AKHDIYAN/Projek-SPK-Web-Sederhana.git
   cd Projek-SPK-Web-Sederhana
   ```

2. Jalankan aplikasi dengan membuka file `index.html` di browser  
   ✅ Tidak memerlukan server, backend, atau database!

---

## 🖼️ Screenshot Aplikasi

| Halaman Utama | Grafik Radar | Perbandingan SAW-TOPSIS |
|---------------|--------------|--------------------------|
| ![](Asset/review1.png) | ![](AssetPreview2.png) | ![](AssetPreview3.png) |

---

## 📊 Metode SPK yang Digunakan

### 🔸 SAW (Simple Additive Weighting)
> Metode yang menghitung nilai akhir dengan menjumlahkan skor dari tiap kriteria setelah dinormalisasi dan diberi bobot.

### 🔹 TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
> Mengukur jarak setiap alternatif ke solusi ideal positif (terbaik) dan solusi ideal negatif (terburuk), lalu memilih yang paling mendekati solusi ideal.

---

## 🌐 Demo Online

Jika kamu sudah mengaktifkan GitHub Pages, aplikasi bisa diakses melalui:
🔗 [https://akhdiyan.github.io/Projek-SPK-Web-Sederhana](https://akhdiyan.github.io/Projek-SPK-Web-Sederhana)

---

## 📜 Lisensi

MIT License © 2025 [Muhammad Raissa Akhdiyan](https://github.com/AKHDIYAN)

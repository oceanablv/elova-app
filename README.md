# Elova App

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)

Elova App adalah website katalog dan pemesanan untuk produk pot semai ramah lingkungan berbahan pelepah pisang. Aplikasi ini menampilkan landing page produk, alur pemesanan via WhatsApp, pencatatan leads, serta portal admin untuk mengelola katalog produk.

## Preview

> Project ini cocok digunakan sebagai landing page bisnis produk eco-friendly, katalog UMKM, atau MVP e-commerce ringan berbasis WhatsApp.

## Fitur Utama

- Landing page produk Elova dengan tampilan modern dan responsif.
- Katalog produk dengan harga, badge, manfaat, dan gambar produk.
- Modal pembelian dengan kalkulasi jumlah dan estimasi total harga.
- Integrasi tombol WhatsApp untuk mengirim pesan pesanan otomatis.
- Pencatatan leads pemesanan ke Supabase.
- Portal admin untuk melihat leads masuk.
- CRUD produk dari dashboard admin.
- Fallback data lokal saat koneksi database belum tersedia.

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- React Icons
- Supabase
- Vercel

## Struktur Project

```txt
elova-app/
+-- app/
|   +-- globals.css
|   +-- layout.js
|   +-- page.js
+-- public/
+-- package.json
+-- next.config.mjs
+-- README.md
```

## Menjalankan Project

Pastikan Node.js sudah terpasang di komputer kamu.

1. Install dependencies:

```bash
npm install
```

2. Jalankan development server:

```bash
npm run dev
```

3. Buka browser:

```txt
http://localhost:3000
```

## Script yang Tersedia

```bash
npm run dev
```

Menjalankan aplikasi dalam mode development.

```bash
npm run build
```

Membuat production build.

```bash
npm run start
```

Menjalankan production server setelah build.

```bash
npm run lint
```

Menjalankan pengecekan linting.

## Login Admin Lokal

Untuk uji coba dashboard admin secara lokal:

```txt
Email    : admin@elova.id
Password : admin123
```

Setelah login, buka halaman admin melalui:

```txt
/#/admin
```

## Database

Aplikasi menggunakan Supabase untuk:

- Menyimpan katalog produk.
- Mencatat leads dari klik pemesanan WhatsApp.
- Autentikasi admin.

Saat database tidak tersedia, aplikasi tetap dapat berjalan menggunakan data produk fallback lokal.

## Deploy ke Vercel

Cara paling mudah:

1. Push project ini ke GitHub.
2. Buka [Vercel](https://vercel.com).
3. Pilih **Add New Project**.
4. Import repository GitHub project ini.
5. Gunakan pengaturan default untuk Next.js.
6. Klik **Deploy**.

Vercel akan otomatis menjalankan:

```bash
npm run build
```

Setiap kali kamu push perubahan ke GitHub, Vercel dapat melakukan redeploy otomatis.

## Push ke GitHub

Jika repository GitHub belum dibuat:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/elova-app.git
git push -u origin main
```

Ganti `username` dengan username GitHub kamu dan `elova-app` dengan nama repository yang kamu buat.

Jika repository sudah terhubung:

```bash
git add .
git commit -m "Update project"
git push
```

## Catatan Pengembangan

- Simpan kredensial dan konfigurasi sensitif di environment variables sebelum production.
- Pastikan tabel Supabase sudah sesuai dengan struktur data produk dan leads.
- Uji fitur WhatsApp, admin login, dan CRUD produk sebelum deploy final.

## Lisensi

Project ini dibuat untuk kebutuhan pengembangan website Elova.

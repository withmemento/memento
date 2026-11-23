# Website Memento — Panduan

## Isi folder
```
index.html        kerangka halaman (tidak perlu diubah)
css/style.css     tampilan: warna & font di bagian paling atas (:root)
js/app.js         semua interaksi (galeri, filter, lightbox, menu)
content/*.json    SEMUA isi website: teks, foto, galeri, lokasi, kontak
images/           foto (gallery, booth, brand, uploads)
fonts/            Meow Script & Libre Caslon (+ lisensi OFL)
.pages.yml        pengaturan panel admin (Pages CMS)
```

## Setup sekali saja (±20 menit)
1. **GitHub**: buat akun di github.com → New repository (misal `memento-website`, Private boleh) → "uploading an existing file" → seret SEMUA isi folder ini (termasuk `.pages.yml`; kalau file bertitik tidak ikut, buat file baru bernama `.pages.yml` lalu tempel isinya) → Commit.
2. **Hosting (Cloudflare Pages)**: dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → pilih repo tadi.
   Framework preset: **None**, Build command: **(kosongkan)**, Output directory: **/** → Save and Deploy.
   Website langsung online di `nama-project.pages.dev`.
3. **Domain**: Cloudflare Pages → project → Custom domains → tambahkan domain kamu, ikuti instruksi DNS.
4. **Panel admin**: buka **app.pagescms.org** → Sign in with GitHub → izinkan akses ke repo → pilih repo `memento-website`.

## Cara edit sehari-hari
Buka app.pagescms.org → pilih repo → menu kiri:
- **Galeri (Archive)**: tambah foto (Add), hapus (ikon sampah), atur urutan (drag), ganti kategori/look/backdrop. Mau sembunyikan sementara tanpa hapus → matikan "Tampilkan di website".
- **Teks & foto per bagian**: semua tulisan & foto di tiap bagian halaman.
  Di kolom judul: `*kata*` = huruf miring merah, tekan Enter = pindah baris.
- **Find Your Frame — Look / Backdrop**: teks, foto preview, tampil/sembunyi.
  Look **Black & White** sekarang disembunyikan. Untuk menampilkan: isi Foto preview + nyalakan "Tampilkan", lalu di Galeri set look foto B&W-nya ke "Black & White".
- **Prints / frame**, **Lokasi cabang**, **Kontak & kategori**.
Klik **Save** → otomatis tersimpan ke GitHub → Cloudflare memperbarui website dalam ±1 menit.

## Tips foto
- Upload foto JPG/PNG/WebP. Usahakan sisi terpanjang ±1600 px dan di bawah ±500 KB (kompres gratis di squoosh.app) supaya website tetap cepat.
- Kolom lebar/tinggi di galeri boleh dikosongkan, website mengukurnya sendiri.

## Hal yang butuh edit kode (jarang)
- Menambah **kategori baru** / **look baru** / **backdrop baru** dengan ID baru: tambahkan juga ID-nya di daftar pilihan `.pages.yml` (bagian gallery → categories/look/background) supaya muncul di dropdown admin.
- Font Anaktoria: taruh `Anaktoria.woff2` di folder `fonts/`, otomatis aktif.

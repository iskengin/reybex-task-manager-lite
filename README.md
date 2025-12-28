# Reybex Mobile PWA

Alpine.js, Axios ve Tailwind CSS kullanılarak geliştirilmiş mobil tasarımlı Progressive Web Application (PWA).

## Özellikler

- 🔐 Token tabanlı authentication
- 📱 Mobil-first responsive tasarım
- 📲 PWA desteği (telefonda uygulama gibi çalışır)
- 🎨 Modern ve minimal UI
- ⚡ Hızlı ve hafif

## Teknolojiler

- **Alpine.js** - Hafif JavaScript framework
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Service Worker** - Offline desteği ve caching

## Proje Yapısı

```
/
├── index.html              # Ana HTML dosyası
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── .nojekyll              # GitHub Pages için
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js         # Ana uygulama
│   │   ├── auth.js        # Authentication servisi
│   │   └── api.js         # API konfigürasyonu
│   └── icons/             # PWA iconları
└── README.md
```

## Backend API

Backend endpoint: `https://core-backend.reybex.com/api`

### Login Endpoint

- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Token içeren response (token, access_token veya data.token formatında)

## GitHub Pages Deployment

1. Repository'yi GitHub'a push edin
2. Repository Settings > Pages bölümüne gidin
3. Source olarak `main` branch'ini seçin
4. Save butonuna tıklayın
5. Birkaç dakika içinde siteniz yayında olacak

URL formatı: `https://[username].github.io/[repository-name]/`

## PWA Kurulumu

### iOS (Safari)
1. Safari'de siteyi açın
2. Paylaş butonuna tıklayın
3. "Ana Ekrana Ekle" seçeneğini seçin

### Android (Chrome)
1. Chrome'da siteyi açın
2. Menüden "Ana ekrana ekle" seçeneğini seçin
3. Onaylayın

## Geliştirme

Proje static dosyalardan oluşur, build gerektirmez. Sadece dosyaları düzenleyip commit edin.

## Notlar

- Token localStorage'da saklanır
- 401 hatası durumunda otomatik logout yapılır
- Service Worker offline desteği sağlar
- Tüm API isteklerine otomatik olarak token eklenir

## Lisans

Bu proje özel kullanım içindir.


# Docker Deployment Guide

## Hızlı Başlangıç

### 1. Ortam Değişkenlerini Ayarla

```bash
# .env dosyasını düzenle veya .env.docker kullan
cp .env.docker .env
```

### 2. Docker Compose ile Çalıştır

```bash
# Build ve start
docker-compose up -d --build

# Logları izle
docker-compose logs -f app

# Durumu kontrol et
docker-compose ps
```

### 3. Health Check

```bash
curl http://localhost/api/health
```

## Komutlar

### Container Yönetimi

```bash
# Başlat
docker-compose up -d

# Durdur
docker-compose down

# Yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f

# Sadece app logları
docker-compose logs -f app

# Sadece db logları
docker-compose logs -f db
```

### Database İşlemleri

```bash
# Prisma migrate
docker-compose exec app node_modules/.bin/prisma migrate deploy

# Prisma seed
docker-compose exec app node_modules/.bin/prisma db seed

# Database'e bağlan
docker-compose exec db psql -U mutadmin -d mutpanel
```

### Temizlik

```bash
# Container'ları durdur ve sil
docker-compose down

# Volume'ları da sil (DİKKAT: Tüm data silinir!)
docker-compose down -v

# Image'ları da sil
docker-compose down --rmi all
```

## Production Deployment

### 1. Güvenlik

`.env` dosyasında şunları değiştir:

```bash
POSTGRES_PASSWORD=güçlü-bir-şifre
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Port Ayarları

`docker-compose.yml` içinde port'u değiştir:

```yaml
ports:
  - "80:3000"  # veya "443:3000" SSL için
```

### 3. SSL/HTTPS

Nginx veya Traefik gibi reverse proxy kullan.

## Sorun Giderme

### Login Hatası (CredentialsSignin)

Bu hata genellikle database'de admin kullanıcısı yoksa veya şifre eşleşmiyorsa oluşur.

```bash
# 1. Database'de kullanıcıları kontrol et
docker-compose exec app npm run db:check

# 2. Seed'i manuel çalıştır
docker-compose exec app npx prisma db seed

# 3. Database'e direkt bağlanıp kontrol et
docker-compose exec db psql -U mutadmin -d mutpanel -c "SELECT username, email, role FROM \"User\";"

# 4. App loglarını kontrol et (auth hata mesajları için)
docker-compose logs -f app | grep Auth
```

**Default Login Bilgileri:**
- Username: `admin`
- Password: `admin`

### Database bağlantı hatası

```bash
# Database'in hazır olup olmadığını kontrol et
docker-compose exec db pg_isready -U mutadmin

# Database loglarını kontrol et
docker-compose logs db
```

### Migration hatası

```bash
# Container içinde manuel migrate
docker-compose exec app sh
node_modules/.bin/prisma migrate deploy
```

### App başlamıyor

```bash
# Logları kontrol et
docker-compose logs app

# Container'ı yeniden başlat
docker-compose restart app

# Tüm servisleri yeniden başlat
docker-compose down && docker-compose up -d --build
```

## Geliştirme vs Production

### Geliştirme (Local)

```bash
# .env dosyasında localhost kullan
DATABASE_URL="postgresql://mutadmin:password@localhost:5432/mutpanel"

# Sadece database'i Docker'da çalıştır
docker-compose up -d db

# App'i local'de çalıştır
npm run dev
```

### Production (Docker)

```bash
# Her şeyi Docker'da çalıştır
docker-compose up -d --build
```

## Monitoring

### Container Durumu

```bash
docker-compose ps
```

### Resource Kullanımı

```bash
docker stats
```

### Health Check

```bash
# App health
curl http://localhost/api/health

# Database health
docker-compose exec db pg_isready -U mutadmin
```

# Server Setup Checklist

Serverda "sorunsuz" çalışması için Localhost'tan farklı olarak dikkat etmeniz gereken kritik 3 madde vardır:

### 1. Dosya Transferi
Şu dosyaların ve klasörlerin sunucuda olduğundan emin olun:
- `docker-compose.yml`
- `Dockerfile`
- `package.json` & `package-lock.json`
- `src/` klasörü
- `public/` klasörü
- `prisma/` klasörü
- `next.config.ts`
- `docker-entrypoint.sh`

*(Not: `node_modules` veya `.next` klasörlerini yüklemenize GEREK YOKTUR, Docker bunları kendisi oluşturur.)*

### 2. .env Dosyası Ayarları (ÇOK ÖNEMLİ)
Sunucuda, proje klasörünün içinde `.env` adında bir dosya oluşturun. İçeriği şöyle olmalıdır:

```ini
# Veritabanı (Docker içindeki isme göre)
# Eğer docker-compose.yml içinde db servisi ismi 'db' ise host: db olmalı.
DATABASE_URL="postgresql://mutadmin:MutPanel2024!@db:5432/mutpanel?schema=public"

# NextAuth Ayarları
# Sunucunuzun IP adresi veya Domain adresi
# ÖRN: http://192.168.1.100 veya https://mutpanel.com
NEXTAUTH_URL="http://SUNUCU_IP_ADRESI_VEYA_DOMAIN"

# Güvenlik Anahtarı (Rastgele uzun bir şifre yazın)
NEXTAUTH_SECRET="buraya-cok-gizli-uzun-bir-sifre-yazin"

# Port (Opsiyonel, docker-compose 80 kullanıyor)
APP_PORT=80
```

> **Dikkat:** `NEXTAUTH_URL` ayarını yapmazsanız giriş yaparken hata alırsınız veya localhost'a yönlendirilirsiniz.

### 3. Port İzni (Firewall)
Sunucunuzun **80** (HTTP) portunun dışarıya açık olduğundan emin olun.
- AWS/Azure/DigitalOcean kullanıyorsanız Security Group ayarlarından 80 portunu açın.
- Linux içinden kontrol etmek için: `sudo ufw allow 80`

### Kurulum Komutu
Her şey hazırsa dosya dizininde:
```bash
docker-compose up -d --build
```

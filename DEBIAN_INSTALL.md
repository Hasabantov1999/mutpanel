# Debian Sunucu Kurulum Rehberi

Docker, Debian üzerinde çok stabil çalışır. Eğer sunucunuzda Docker henüz kurulu değilse, aşağıdaki adımları sırasıyla uygulayarak kurulumu yapabilirsiniz.

### 1. Sunucuyu Güncelleme
Önce paket listelerini güncelleyelim:
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Gerekli Paketlerin Kurulumu
HTTPS üzerinden paket kurulumu için gerekli araçları yükleyin:
```bash
sudo apt install -y ca-certificates curl gnupg
```

### 3. Docker Resmi GPG Anahtarını Ekleme
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 4. Docker Deposunu (Repository) Ekleme
```bash
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5. Docker ve Docker Compose Kurulumu
Depoları güncelleyip kurulumu yapın:
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 6. Kurulumu Doğrulama
Docker'ın çalıştığından emin olun:
```bash
sudo systemctl status docker
```
*(Çıkmak için `q` tuşuna basın)*

### 7. Projeyi Başlatma
Artık dosyalarınızı sunucuya attıktan sonra proje klasörüne gidip şu komutu verebilirsiniz:

```bash
# Proje klasörüne girin (örn: cd /home/kullanici/mut-demo)
sudo docker compose up -d --build
```
*(Not: `docker-compose` komutu yeni versiyonlarda `docker compose` (arada tire olmadan) olarak değişmiştir, ancak Debian'da ikisi de çalışabilir.)*

### İpucu: Sudo Kullanmadan Docker Çalıştırma (Opsiyonel)
Sürekli `sudo` yazmak istemiyorsanız şu anki kullanıcınızı docker grubuna ekleyin:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
Bundan sonra direkt `docker compose up -d` yazabilirsiniz.

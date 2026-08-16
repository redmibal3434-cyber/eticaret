# Kampanya Pro

Tek ürünlü kampanyaları yayınlamak, sipariş almak ve ziyaretçi akışını anlık izlemek için hazırlanmıştır.

## Kurulum

1. Supabase projesi oluşturun.
2. Yeni kurulumda `supabase.sql` dosyasının tamamını Supabase SQL Editor içinde çalıştırın.
3. Dosyaları yeni bir GitHub deposunun köküne yükleyin.
4. Depoyu Vercel'e bağlayın.
5. `.env.example` içindeki beş değişkeni Vercel Environment Variables bölümüne ekleyin.
6. Vercel'de yeniden deploy edin.
7. `site-adresiniz.com/admin.html` adresinden yönetim paneline girin.

## Yönetim paneli

- Logo, banner, başlık, tanıtım metinleri, renkler ve footer görselleri
- Ürün ekleme/düzenleme, fiyat, eski fiyat, stok ve görünürlük
- Sipariş listesi ve sipariş durumu
- Sipariş kaydında müşterinin 16 haneli talep numarası ve `SK-05-32` biçimindeki sosyal medya avantaj kodu
- Ana sayfa, sepet, adres ve talep adımlarındaki anlık ziyaretçiler

Kart şifresi, CVV veya SMS doğrulama kodu toplanmaz. İkinci adımda 16 haneli talep numarası ve sabit `SK-` önekli dört rakamlı avantaj kodu alınır.

## Mevcut kurulumu güncelleme

Önce GitHub dosyalarını bu sürümle değiştirin. Ardından Supabase SQL Editor içinde yalnızca `supabase-talep-guncelleme.sql` dosyasını bir kez çalıştırın ve Vercel deployment'ını yenileyin.

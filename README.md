# Kampanya Pro

Tek ürünlü kampanyaları yayınlamak, sipariş almak ve ziyaretçi akışını anlık izlemek için hazırlanmıştır.

## Kurulum

1. Supabase projesi oluşturun.
2. `supabase.sql` dosyasının tamamını Supabase SQL Editor içinde çalıştırın.
3. Dosyaları yeni bir GitHub deposunun köküne yükleyin.
4. Depoyu Vercel'e bağlayın.
5. `.env.example` içindeki beş değişkeni Vercel Environment Variables bölümüne ekleyin.
6. Vercel'de yeniden deploy edin.
7. `site-adresiniz.com/admin.html` adresinden yönetim paneline girin.

## Yönetim paneli

- Logo, banner, başlık, tanıtım metinleri, renkler ve footer görselleri
- Ürün ekleme/düzenleme, fiyat, eski fiyat, stok ve görünürlük
- Tek kullanımlık veya çok kullanımlık kampanya kodları
- Sipariş listesi ve sipariş durumu
- Ana sayfa, sepet, adres ve kampanya adımlarındaki anlık ziyaretçiler

Kart numarası, CVV, kart şifresi veya SMS doğrulama kodu toplanmaz. Kampanya doğrulaması, admin panelinden oluşturulan alfanümerik kodlarla yapılır.

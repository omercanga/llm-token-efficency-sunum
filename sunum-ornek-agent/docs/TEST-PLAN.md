# Manuel Test Planı (FAZ 5)

Otomatik test kapsamadığı (görsel/işitsel/uçtan uca kullanıcı akışı)
senaryolar için. `npm run dev` ile başlatılan uygulama üzerinde,
FAZ 0'da tanımlanan tarayıcılarda (son 2 sürüm Chrome/Firefox/Safari)
çalıştırılmalıdır.

| #   | Senaryo                               | Adımlar                                                                                                                             | Beklenen Sonuç                                                                                                                                                                              |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | İlk yükleme                           | Sayfayı aç.                                                                                                                         | Canvas görünür, oyuncu gemisi (yeşil, burnu yukarı bakan vektör şekil) ekranın alt-ortasında; HUD'da "SKOR: 0 CAN: 3" yazıyor; oyun sonu ekranı gizli.                                      |
| 2   | Hareket ve sınır kelepçeleme          | Ok tuşlarını (↑↓←→) tek tek ve birlikte (çapraz) basılı tut.                                                                        | Gemi 4 yönde akıcı hareket eder; ekran kenarına ulaşınca dışarı çıkmaz, kenarda durur.                                                                                                      |
| 3   | Ateşleme ve cooldown                  | Boşluk tuşuna bas; ardından boşluğu basılı tutarak spam'lemeyi dene.                                                                | Her basışta bir mermi yukarı doğru hareket eder; mermiler arasında gözle görülür bir minimum aralık vardır (cooldown), sonsuz mermi spam'i olmaz.                                           |
| 4   | Dalga/spawn davranışı                 | ~30 saniye boyunca oyunu izle.                                                                                                      | Düşmanlar (kırmızı, burnu aşağı bakan vektör şekil) ekranın üstünden belirip aşağı iner; bir dalga temizlenince yeni dalga (farklı hız/sayıda düşman) başlar.                               |
| 5   | Mermi-düşman çarpışması ve skor       | Bir düşmanı mermiyle vur.                                                                                                           | Düşman ekrandan kaybolur, HUD'daki skor artar, kısa bir "patlama" sesi duyulur (ilk tuş basımından sonra).                                                                                  |
| 6   | Düşman-oyuncu çarpışması ve can kaybı | Bir düşmanın gemine çarpmasına izin ver (kaçınmadan bekle).                                                                         | HUD'daki can sayısı 1 azalır, bir "isabet" sesi duyulur, oyun devam eder (can > 0 ise).                                                                                                     |
| 7   | Oyun sonu ekranı                      | Canı 0'a düşür (3 çarpışma).                                                                                                        | "OYUN BİTTİ" ekranı belirir, son skor gösterilir, isim girişi formu görünür; arka plandaki oyun donmuş haldedir.                                                                            |
| 8   | Geçersiz isim reddi                   | Oyun sonunda isim alanına boş bırak / 12 karakterden uzun bir isim / `<script>` gibi özel karakterli bir isim gir ve "Kaydet"e bas. | Her durumda kayıt reddedilir, ilgili hata mesajı (Türkçe, anlaşılır) gösterilir; sayfa kaynağında hiçbir yerde bu girdi HTML olarak işlenmez (View Source ile kontrol edilebilir).          |
| 9   | Geçerli isimle kayıt ve kalıcılık     | Geçerli bir isim (ör. "Ada") gir, kaydet; ardından sayfayı yenile (F5) ve tekrar oyna, tekrar oyun sonuna gel.                      | İlk kayıt skor listesinde görünür; sayfa yenilendikten sonra bile liste kalıcıdır (localStorage); ikinci oyundan sonra liste büyükten küçüğe sıralı iki kayıt gösterir.                     |
| 10  | Ses ve autoplay politikası            | Sayfayı yeni aç, hiçbir tuşa basmadan birkaç saniye bekle; ardından ilk kez bir tuşa bas.                                           | İlk etkileşimden önce hiçbir ses çalmaz (tarayıcı konsolunda autoplay uyarısı/hatası olmamalı); ilk tuş basımından sonra ses efektleri (ateş, patlama, isabet, oyun sonu) duyulmaya başlar. |

## Notlar

- Senaryo 4, 6 ve 7 gerçek zamanlı oynanış gerektirdiğinden tam
  otomatikleştirilmemiştir; birim testler (bkz. `src/state/gameState.test.ts`,
  `src/systems/*.test.ts`) bu mantığın doğruluğunu sentetik durumlarla
  zaten %100 satır/dal kapsamıyla doğrular. Bu plan, gerçek tarayıcıda
  _görsel ve işitsel_ deneyimi doğrulamak içindir.
- Senaryo 8 ve 9, projenin güvenlik politikasının (bkz.
  [docs/SECURITY.md](SECURITY.md)) fiilen çalıştığını doğrular.

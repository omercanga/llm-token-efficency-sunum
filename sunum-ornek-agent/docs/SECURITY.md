# Güvenlik ve Tehdit Modeli

Bu belge, oyunun STRIDE tabanlı kısa tehdit modelini ve buna karşılık
alınan/önerilen önlemleri tanımlar. Kapsam: tamamen istemci tarafında
çalışan, sunucusuz (v1) bir tarayıcı oyunu.

## STRIDE Analizi

| Kategori                                  | Tehdit                                                                                                                                                                                          | Bu sürümdeki durum / önlem                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**poofing (Kimlik Sahteciliği)         | Oyunda kullanıcı hesabı/kimlik doğrulama yok; sahtecilik yapılacak bir "kimlik" bulunmuyor.                                                                                                     | Kapsam dışı (v1). İleride online skor tablosu/multiplayer eklenirse, sunucu tarafı oturum/kimlik doğrulama gerekecek — bkz. `docs/ROADMAP.md`.                                                                                                                                                                                                                                                                |
| **T**ampering (Kurcalama)                 | Yüksek skor verisi `localStorage`'da tutulur; kullanıcı DevTools ile doğrudan düzenleyebilir.                                                                                                   | **Kabul edilen risk (v1)**: imzalama/sunucu doğrulaması yok. Ancak veri **versiyonlu bir şema** (`schemaVersion`) ile tanımlandı (bkz. [ADR-0003](adr/0003-persistence-abstraction.md)) — ileride sunucu tarafı doğrulama eklendiğinde mevcut/eski istemci verisi ayırt edilebilir. Skor, yalnızca oyunun kendi çarpışma/skor sistemi tarafından üretilir; kullanıcıdan doğrudan sayısal skor girişi alınmaz. |
| **R**epudiation (İnkâr)                   | Sunucu yok, işlem kaydı/log yok; tek oyunculu, yerel bir oturumda "inkâr edilecek" bir eylem yok.                                                                                               | Kapsam dışı (v1).                                                                                                                                                                                                                                                                                                                                                                                             |
| **I**nformation Disclosure (Bilgi İfşası) | `localStorage`'daki isim+skor verisi aynı origin'deki her script tarafından okunabilir. Hassas/PII değildir (kullanıcının kendi seçtiği takma ad).                                              | Oyun hiçbir veriyi ağ üzerinden başka bir yere göndermez (v1'de telemetri/analytics yok). Üçüncü taraf script/reklam eklenmeyecek.                                                                                                                                                                                                                                                                            |
| **D**enial of Service                     | Çok uzun/özel karakterli bir isim girişi; render katmanında performans sorununa veya düzen bozulmasına yol açabilir. Aşırı sayıda mermi/düşman üreterek (teorik olarak) frame süresini şişirme. | İsim girişi **uzunluk (maks. 12 karakter) ve karakter kısıtı (yalnızca harf/rakam/boşluk, `[A-Za-z0-9 ]`)** ile sınırlanır; sunucu olmadığı için ağ tabanlı DoS senaryosu yok. Spawn sistemi veri-güdümlü (`waves.json`) ve sabit üst sınırlarla çalışır; aynı anda ekrandaki mermi/düşman sayısı sınırlandırılır.                                                                                            |
| **E**levation of Privilege                | Yetki seviyesi/rol kavramı yok (tek oyunculu, sunucusuz).                                                                                                                                       | Kapsam dışı (v1). İleride sunucu tarafı eklenirse (skor gönderimi, moderasyon vb.) yetkilendirme sınırları o zaman tanımlanacak.                                                                                                                                                                                                                                                                              |

## Özellikle Vurgulanan Riskler ve Önlemler

### 1. Oyuncu ismi — XSS

- İsim **asla `innerHTML` ile basılmaz**; DOM'a yazarken yalnızca
  `textContent` (veya eşdeğer güvenli API) kullanılır.
- Giriş doğrulama: maks. 12 karakter, yalnızca `[A-Za-z0-9 ]` (harf,
  rakam, boşluk) kabul edilir; izin verilmeyen karakterler kullanıcıya
  hata gösterilerek reddedilir (sessizce kırpma/temizleme yapılmaz —
  kullanıcı ne yazdığını görebilmeli).
- Doğrulama hem `ui/` katmanında (kullanıcı deneyimi için anında geri
  bildirim) hem de `persistence/` sınırında (`submitScore` öncesi, son
  savunma hattı olarak) uygulanır.

### 2. Skor verisi — kurcalanabilirlik

- Skor şeması versiyonludur (`schemaVersion: 1`), bkz.
  [ADR-0003](adr/0003-persistence-abstraction.md).
- v1'de imzalama/sunucu doğrulaması **yok** (tek oyunculu, yerel liste;
  risk kabul edilebilir düzeyde). Bu, ileride sunucu tarafı doğrulama
  eklenmesini engellemeyecek şekilde tasarlandı.

### 3. Bağımlılık politikası

- Minimum bağımlılık ilkesi: yalnızca geliştirme araçları (Vite,
  TypeScript, ESLint, Prettier, Vitest) ve gerekliyse tek bir
  pre-commit aracı (`lint-staged` + `husky` veya eşdeğeri) kullanılır;
  çalışma zamanı (runtime) bağımlılığı **sıfır** hedeflenir (Canvas 2D +
  Web Audio API tarayıcı yerlisidir).
- `package-lock.json` commit edilir (kilit dosyası zorunlu).
- `npm audit --audit-level=high` CI pipeline'ında zorunlu bir adımdır;
  başarısız olursa build kırmızı olur.

### 4. CSP ve `eval`/`Function` yasağı

- Önerilen CSP, `index.html` içinde bir `<meta http-equiv="Content-Security-Policy">`
  etiketi olarak uygulanmıştır:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'
  ```
  (`style-src`'de `'unsafe-inline'`, Vite'ın geliştirme modunda enjekte
  ettiği stiller için gerekebilir; üretim build'inde harici CSS dosyası
  kullanılarak bu da kaldırılabilir — bkz. `docs/RUNBOOK.md`.)
- `frame-ancestors` ve `sandbox` direktifleri tarayıcılar tarafından
  **meta etiketinde yok sayılır** — yalnızca HTTP başlığı olarak
  gönderildiklerinde etkilidirler. Bu nedenle üretim dağıtımında (statik
  dosya sunucusu/CDN seviyesinde) ayrıca şu başlık eklenmelidir:
  ```
  Content-Security-Policy: frame-ancestors 'none'
  ```
  Bu, `docs/RUNBOOK.md`'de bir dağıtım (deploy) adımı olarak belgelenir.
- ESLint kuralı olarak `no-eval` ve `no-new-func` **error** seviyesinde
  zorunlu kılınır (bkz. FAZ 3 ESLint yapılandırması); `eval()` ve
  `new Function()` kullanımı derleme/lint aşamasında engellenir.

## Kapsam Dışı (v1)

- Sunucu tarafı skor doğrulama/imzalama (şema hazır, doğrulama yok).
- Kimlik doğrulama / hesap sistemi.
- Ağ üzerinden veri iletimi (telemetri, analytics, online skor tablosu).

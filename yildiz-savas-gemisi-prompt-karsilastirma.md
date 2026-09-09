# Vibe Coding vs. Agentik/Mühendislik Yaklaşımı

## Örnek Proje: "Legacy" Yıldız Savaş Gemisi Oyunu

> 🎯 **Tek cümlelik özet:** Vibe coding *ilk çalışır sürüme* en hızlı yoldur; mühendislik yaklaşımı *ikinci, üçüncü ve yüzüncü değişikliğe* en hızlı yoldur. Fark, projenin başlamasında değil **yaşamasında** ortaya çıkar.

Her iki prompt da **aynı oyunu** hedefler ki fark yönteme, ürüne değil, süreç ve kaliteye yansısın:

> Tarayıcıda çalışan, retro (80'ler arcade) görünümlü bir uzay savaş gemisi oyunu. Oyuncu gemisi ok tuşlarıyla hareket eder, boşluk ile ateş eder, dalga dalga gelen düşmanları vurur, skor ve can vardır, oyun bitince skor kaydedilir.

**İçindekiler**
1. [Prompt 1 — Vibe Coding](#prompt-1--vibe-coding)
2. [Prompt 2 — Agentik / Mühendislik Yaklaşımı](#prompt-2--agentik--mühendislik-yaklaşımı)
3. [Mühendislik, Vibe Coding'in Neresine Giriyor?](#mühendislik-vibe-codingin-neresine-giriyor)
4. [Karşılaştırma Deneyi](#karşılaştırma-deneyi-i̇ki-uygulamayı-aynı-testlere-sok)
5. [Sonuç](#sonuç)

---

## PROMPT 1 — Vibe Coding

**Beklenen çıktı:** `index.html` — çift tıkla, oyna. Tek dosya, tek adım.

<details>
<summary>Tam prompt metnini gör</summary>

```
Bana retro tarzda bir yıldız savaş gemisi oyunu yap. Tarayıcıda çalışsın,
tek bir HTML dosyası olsun, açınca direkt oynayayım.

- Ok tuşlarıyla gemi hareket etsin, boşluk tuşuyla ateş etsin
- Yukarıdan dalga dalga düşman gemileri gelsin, bazıları ateş etsin
- Skor ve 3 can olsun, can bitince "GAME OVER" yazsın
- En yüksek skor kaydedilsin, oyuncu ismini girip kaydedebilsin
- Piksel/neon 80'ler arcade havası olsun, ses efekti de olsun
- Kod uzun olabilir, sorun değil, sadece çalışsın

Hadi başla.
```

</details>

---

## PROMPT 2 — Agentik / Mühendislik Yaklaşımı

**Beklenen çıktı:** Bir repo. `npm run dev` ile oyna, `npm test` ile doğrula. Yedi fazdan geçen, onay noktalarıyla ilerleyen bir süreç.

<details>
<summary>Tam prompt metnini gör (7 faz)</summary>

```
Sen kıdemli bir oyun yazılımı mühendisi ve teknik lider olarak çalışan bir
ajansın. Aşağıdaki projeyi FAZLAR halinde yürüteceksin. Her fazın sonunda
DUR, çıktını özetle ve onayımı bekle. Onay almadan bir sonraki faza geçme.

## PROJE
Tarayıcıda çalışan, retro (80'ler arcade) yıldız savaş gemisi oyunu.
Oyuncu ok tuşlarıyla hareket eder, boşluk ile ateş eder, dalga dalga gelen
düşmanları vurur. Skor, can, oyun sonu ve isimle kaydedilen yüksek skor
listesi vardır. İleride online skor tablosu ve çok oyunculu mod eklenecek;
mimari bunu şimdiden engellememeli.

## FAZ 0 — Keşif ve Gereksinim
- Fonksiyonel ve fonksiyonel olmayan gereksinimleri listele
  (performans hedefi: 60 FPS, orta seviye laptop; erişilebilirlik: klavye
  yeniden atanabilir; tarayıcı desteği: son 2 sürüm Chrome/Firefox/Safari).
- Kapsam dışı olanları açıkça yaz (bu sürümde: online, mobil dokunma).
- Belirsiz gördüğün her şeyi bana SOR, varsayım yapma.

## FAZ 1 — Mimari ve Karar Kayıtları (ADR)
- Teknoloji seçimi: TypeScript + Vite + Canvas 2D (gerekçelendir; alternatif
  olarak Phaser'ı neden seçmediğini/seçtiğini yaz).
- Klasör yapısı ve modül sınırları: engine (game loop, input, render),
  entities (player, enemy, bullet), systems (collision, spawn, scoring),
  state (immutable game state), persistence (storage adapter arayüzü), ui.
- Persistence için ARAYÜZ tanımla: bugün localStorage, yarın REST/WebSocket.
  Oyun mantığı depolamanın ne olduğunu bilmemeli.
- En az 3 ADR yaz (docs/adr/0001-*.md): render tekniği, state yönetimi,
  depolama soyutlaması.

## FAZ 2 — Tehdit Modeli ve Güvenlik Gereksinimleri
- STRIDE ile kısa bir tehdit modeli çıkar. Özellikle:
  - Oyuncu ismi: XSS — asla innerHTML ile basılmayacak, uzunluk/karakter
    kısıtı olacak.
  - Skor verisi: kurcalanabilir (client-side). Bugün için imzalama yok ama
    sunucu tarafı doğrulamaya hazır şema (versiyonlu JSON) tanımla.
  - Bağımlılık politikası: minimum bağımlılık, kilit dosyası, `npm audit`
    CI'da zorunlu.
  - CSP başlığı/meta önerisi ve `eval`/`Function` yasağı (ESLint kuralı).
- Bunları docs/SECURITY.md içine yaz.

## FAZ 3 — Proje İskeleti ve Kalite Kapıları
- Repo kur: package.json, tsconfig (strict), ESLint + Prettier, Vitest.
- Scriptler: dev, build, test, lint, typecheck, audit.
- Basit CI (GitHub Actions): lint → typecheck → test → build → audit.
- Pre-commit hook (lint-staged) ekle.
- README.md: kurulum, çalıştırma, test, klasör yapısı, katkı kuralları.

## FAZ 4 — Uygulama (Dikey Dilimler)
Her dilim: test yaz → kod yaz → lint/test geçir → kısa CHANGELOG girişi.
1. Game loop + sabit zaman adımı + boş sahne render
2. Oyuncu hareketi + input mapping (yeniden atanabilir)
3. Mermi + düşman + çarpışma sistemi (saf fonksiyon, birim testli)
4. Dalga/spawn sistemi (veri-güdümlü: waves.json)
5. Skor, can, oyun sonu durumu
6. Yüksek skor: persistence arayüzü + localStorage adaptörü + isim girişi
   (sanitize + validate)
7. Retro görsel/ses katmanı (ses: kullanıcı etkileşimi sonrası başlat)

Kurallar:
- Oyun mantığı DOM'a dokunmaz; sadece ui/ ve render katmanı dokunur.
- Global değişken yok. Magic number yok (config/constants.ts).
- Her public fonksiyonda JSDoc.
- Çarpışma, skor ve spawn sistemlerinde %80+ satır kapsaması.

## FAZ 5 — Doğrulama
- Tüm kalite kapıları yeşil olmalı; sonucu bana göster.
- Manuel test listesi (docs/TEST-PLAN.md): 10 senaryo.
- Lighthouse performans raporu ve FPS ölçümü.

## FAZ 6 — Bakım ve Büyüme Dokümanları
- docs/ROADMAP.md: online skor tablosu ve çok oyunculu mod için
  hangi modüllerin değişeceği, hangilerinin değişmeyeceği.
- docs/RUNBOOK.md: bilinen sorunlar, hata ayıklama, sürüm çıkarma adımları.
- CHANGELOG.md (Keep a Changelog formatı), SemVer.

## TESLİM
`npm install && npm run dev` ile çalışan oyun, `npm test` yeşil,
`npm run build` ile dist/ üretilmiş halde.
```

</details>

---

## Mühendislik, Vibe Coding'in Neresine Giriyor?

Prompt 1'i satır satır alıp, Prompt 2'deki hangi unsurun oraya "yamandığını" gösteren harita. Bu satırlar, **"vibe'dan mühendisliğe geçiş"** noktalarıdır:

| Prompt 1 satırı | Vibe'da ne olur | Mühendislik girişi (Prompt 2 ref.) |
|---|---|---|
| "tek bir HTML dosyası olsun" | 1500 satırlık tek dosya, her şey global | FAZ 1: modül sınırları, klasör yapısı |
| "oyuncu ismini girip kaydedebilsin" | `innerHTML = isim` → **XSS** | FAZ 2: sanitize/validate, innerHTML yasağı |
| "en yüksek skor kaydedilsin" | `localStorage.setItem` doğrudan oyun kodunda | FAZ 1: persistence arayüzü (yarın online) |
| "dalga dalga düşman gelsin" | Kod içine gömülü sayılar | FAZ 4, adım 4: veri-güdümlü `waves.json` |
| "sadece çalışsın" | Test yok, "benim makinemde çalışıyor" | FAZ 3: test, lint, CI, kalite kapıları |
| *(hiç yazılmadı)* | Neden Canvas seçildi? Kimse bilmiyor | FAZ 1: ADR |
| *(hiç yazılmadı)* | 6 ay sonra hangi versiyon, ne değişti? | FAZ 6: CHANGELOG, SemVer, RUNBOOK |
| *(hiç yazılmadı)* | Bağımlılık yok gibi ama CDN'den script çekiliyor olabilir | FAZ 2: bağımlılık politikası, audit, CSP |

**Kısa özet:** Mühendislik, vibe promptunun *söylemediği* yerlere girer. Vibe "ne istediğini" söyler; mühendislik "nasıl yaşayacağını" söyler.

---

## Karşılaştırma Deneyi: İki Uygulamayı Aynı Testlere Sok

Her iki oyun çalıştıktan sonra **aynı 3 isteği** iki projeye de yönelt ve sonuçları not et.

### Test A — Güvenlik

İsim alanına şunu gir: `<img src=x onerror=alert('xss')>`

| | Beklenen sonuç |
|---|---|
| Vibe | Büyük ihtimalle alert patlar. |
| Mühendislik | Metin olarak görünür veya reddedilir. |

### Test B — Bakım (küçük değişiklik)

İstek: *"Düşmanlar 2. dalgadan sonra %20 daha hızlı olsun."*

| | Beklenen sonuç |
|---|---|
| Vibe | Kodun neresinde olduğunu bulmak için tüm dosyayı okumak gerekir; değişiklik başka bir yeri bozabilir, bunu fark edecek test yoktur. |
| Mühendislik | `waves.json` değişir ya da spawn sisteminde tek satır; birim testi kırılırsa hemen görülür. |

### Test C — Büyüme (mimari değişiklik)

İstek: *"Yüksek skorlar artık bir REST API'ye kaydedilsin, localStorage yedek olsun."*

| | Beklenen sonuç |
|---|---|
| Vibe | Skor mantığı, DOM ve localStorage iç içe; ayırmak refactor gerektirir → risk yüksek, süre uzun. |
| Mühendislik | Yeni bir `RestStorageAdapter` yazılır, arayüz aynı; oyun mantığı değişmez. |

### Ölçüm tablosu (canlı sunumda doldurulacak)

| Ölçüt | Vibe | Mühendislik |
|---|---|---|
| İlk çalışır sürüme kadar süre | | |
| Toplam dosya / satır sayısı | | |
| Test A: XSS var mı? | | |
| Test B: değişen satır sayısı / bozulan şey | | |
| Test C: değişen dosya sayısı / harcanan süre | | |
| Kodu ilk kez gören birinin anlama süresi | | |
| Otomatik test sayısı | | |

---

## Sonuç

Vibe coding **ilk çalışır sürüme** en hızlı yoldur; mühendislik yaklaşımı **ikinci, üçüncü ve yüzüncü değişikliğe** en hızlı yoldur. Fark, projenin "başlaması"nda değil "yaşaması"nda ortaya çıkar — ve güvenlik açıkları neredeyse her zaman vibe promptunun **söylemediği** satırlarda saklanır.

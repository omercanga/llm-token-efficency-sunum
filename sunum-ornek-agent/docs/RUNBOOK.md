# Runbook

## Bilinen Sorunlar / Kabul Edilen Kısıtlar

| Sorun                                                                 | Durum                            | Notlar                                                                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Yüksek skor verisi client-side kurcalanabilir                         | Kabul edilen risk (v1)           | Bkz. [docs/SECURITY.md](SECURITY.md) — Tampering. Versiyonlu şema (`schemaVersion`) sunucu tarafı doğrulamaya hazır; bugün doğrulama yok.                                               |
| `frame-ancestors`/`sandbox` CSP direktifleri meta etiketinde çalışmaz | Bilinen tarayıcı kısıtı          | Yalnızca HTTP başlığı ile etkilidir. Üretimde statik dosya sunucusu/CDN seviyesinde `Content-Security-Policy: frame-ancestors 'none'` başlığı eklenmeli (bkz. aşağıdaki "Yayına Alma"). |
| localStorage'da en fazla 100 skor tutulur                             | Tasarım kararı                   | `MAX_STORED_HIGH_SCORES` (src/config/constants.ts). Sınırsız büyümeyi önler; en düşük skorlar budanır. Görüntülenen liste zaten yalnızca top 10 (`HIGH_SCORE_LIST_SIZE`).               |
| Ses yalnızca ilk kullanıcı etkileşiminden sonra başlar                | Tasarım kararı (tarayıcı kısıtı) | Tarayıcı autoplay politikası gereği; sayfa açılır açılmaz ses beklenmemeli (bkz. `docs/TEST-PLAN.md` senaryo 10).                                                                       |
| Mobil dokunmatik kontrol yok                                          | Kapsam dışı (v1)                 | Bkz. FAZ 0 kapsam kararı.                                                                                                                                                               |

## Hata Ayıklama

### "Oyun donmuş görünüyor / hiçbir şey hareket etmiyor"

1. Tarayıcı konsolunu açın — `#game-canvas` elemanının DOM'da olup
   olmadığını kontrol edin (`document.getElementById('game-canvas')`).
   Yoksa `src/main.ts` içindeki `bootstrap()` bir hata fırlatmış
   olabilir (ör. `#app` elemanı bulunamadı).
2. `state.status === 'gameOver'` olabilir — bu durumda oyun
   _tasarım gereği_ durur (bkz. `updateGameState`'in erken dönüşü).
   HUD'da "CAN: 0" ve oyun sonu ekranı görünüyorsa bu normaldir.
3. Sekme arka plana alınıp geri getirildiyse, `requestAnimationFrame`
   tarayıcı tarafından durdurulmuş olabilir; `MAX_FRAME_DELTA_SECONDS`
   sınırlaması sayesinde geri gelindiğinde "spiral of death" yaşanmaz,
   oyun kaldığı yerden normal hızda devam eder.

### "Ses çalmıyor"

- İlk bir tuşa (ok tuşları, boşluk) veya tıklamaya kadar ses
  **beklenen şekilde** çalmaz (bkz. `attachLazyAudio` in
  `src/main.ts`). Bu bir hata değildir.
- Tarayıcı sekmesi sessize alınmış olabilir (tarayıcı UI'ı, uygulama
  kodu değil).

### "Yüksek skor kaydedilmiyor / kayboluyor"

- `localStorage` devre dışı bırakılmış olabilir (gizli sekme +
  bazı tarayıcı ayarları). `createLocalStorageHighScoreAdapter`,
  `JSON.parse` hatası veya erişim hatası durumunda **sessizce boş
  listeye düşer** (çökme yerine); bu durumda skor o oturumda
  kalıcı olmaz ama oyun çökmez.
- Farklı bir origin'den (ör. `file://` ile açma) test ediliyorsa
  `localStorage` izole olabilir — `npm run dev`/`npm run preview`
  ile `http://localhost` üzerinden test edin.

### Testler yereldeyken kırmızı ama CI'da farklı sonuç veriyor

- `npm ci` (CI'nin kullandığı komut) `package-lock.json`'daki tam
  sürümleri kurar; yerelde `npm install` sonrası kilit dosyası
  değişmiş olabilir. `git diff package-lock.json` ile kontrol edin.

## Sürüm Çıkarma (Release)

1. `main` üzerinde tüm kalite kapılarının yeşil olduğunu doğrulayın:
   ```bash
   npm run lint && npm run typecheck && npm run test:coverage && npm run build && npm run audit
   ```
2. `CHANGELOG.md`'de `[Unreleased]` altındaki maddeleri, yeni sürüm
   numarası ve tarihle bir başlığa taşıyın (Keep a Changelog formatı,
   SemVer):
   ```markdown
   ## [0.2.0] - 2026-01-15

   ### Added

   ...
   ```
3. `package.json`'daki `version` alanını aynı sürümle güncelleyin.
4. Sürüm commit'i oluşturun ve etiketleyin:
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore(release): v0.2.0"
   git tag v0.2.0
   ```
5. `npm run build` ile `dist/` üretin ve statik dosya
   sunucusuna/CDN'e yükleyin.

### Yayına Alma (Deploy) Notu — CSP Başlığı

`index.html`'deki `<meta http-equiv="Content-Security-Policy">` etiketi
`frame-ancestors` ve `sandbox` **hariç** tüm direktifleri kapsar (bkz.
yukarıdaki "Bilinen Sorunlar"). Üretim sunucusunda/CDN'de ayrıca şu
HTTP başlığının eklenmesi önerilir:

```
Content-Security-Policy: frame-ancestors 'none'
```

## SemVer Politikası

- **MAJOR**: `GameState` şeklinde veya `HighScoreStorage`/
  `HighScoreEntry` arayüzlerinde geriye uyumsuz değişiklik (ör. çok
  oyunculu moda geçişte `player` → `players`, bkz.
  [docs/ROADMAP.md](ROADMAP.md)).
- **MINOR**: yeni özellik (yeni düşman tipi, yeni dalga, yeni ses
  efekti) — geriye uyumlu.
- **PATCH**: hata düzeltmeleri, performans iyileştirmeleri, dokümantasyon.

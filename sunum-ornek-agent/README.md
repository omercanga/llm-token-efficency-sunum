# Yıldız Savaşı

Tarayıcıda çalışan, retro (80'ler arcade) yıldız savaş gemisi oyunu.
Ok tuşlarıyla hareket edin, boşluk ile ateş edin, dalga dalga gelen
düşmanları vurun. Skor, can, oyun sonu ve isimle kaydedilen yerel yüksek
skor listesi vardır.

## Kurulum

```bash
npm install
```

## Çalıştırma (geliştirme)

```bash
npm run dev
```

Tarayıcıda açılan adresten oyunu oynayabilirsiniz.

## Test

```bash
npm test              # tüm testleri tek seferlik çalıştırır
npm run test:watch    # izleme modunda çalıştırır
npm run test:coverage # kapsama raporuyla çalıştırır
```

## Kalite Kapıları

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit (strict)
npm run build       # typecheck + production build (dist/)
npm run audit       # npm audit --audit-level=high
```

Bu dört komut, `.github/workflows/ci.yml` içinde her push/PR'da sırayla
(lint → typecheck → test → build → audit) çalışır. Commit öncesi ayrıca
`lint-staged` (Husky pre-commit hook üzerinden) değişen dosyalarda
lint+format uygular.

## Klasör Yapısı

```
src/
  engine/       # game loop (sabit zaman adımı), input, Canvas render pipeline
  entities/     # player, enemy, bullet — saf veri şekilleri + factory fonksiyonlar
  systems/      # collision, spawn, scoring — state üzerinde çalışan saf fonksiyonlar
  state/        # immutable GameState tipi + update/reducer
  persistence/  # HighScoreStorage arayüzü + adaptörler (bugün localStorage)
  ui/           # yalnızca DOM'a dokunan kod (HUD, isim girişi, menüler)
  config/       # constants.ts — magic number yok
  data/         # veri-güdümlü içerik (waves.json)
docs/
  adr/            # mimari karar kayıtları
  SECURITY.md     # tehdit modeli ve güvenlik gereksinimleri
  TEST-PLAN.md    # manuel test senaryoları
  PERFORMANCE.md  # Lighthouse raporu ve FPS ölçümü
  ROADMAP.md      # online skor tablosu / çok oyunculu mod için büyüme planı
  RUNBOOK.md      # bilinen sorunlar, hata ayıklama, sürüm çıkarma
```

**Sınır kuralı**: `state/`, `systems/`, `entities/` hiçbir zaman DOM'a
veya Canvas'a dokunmaz; DOM'a yalnızca `ui/`, Canvas'a yalnızca
`engine/render` dokunur. Mimari kararların gerekçeleri için
[docs/adr/](docs/adr/) klasörüne bakın.

## Katkı Kuralları

- Her değişiklik için önce test yazın (TDD), sonra kodu yazın.
- `npm run lint` ve `npm test` commit öncesi yeşil olmalı (pre-commit
  hook bunu değişen dosyalarda otomatik kontrol eder).
- Global değişken ve magic number yasaktır — sabitler
  `src/config/constants.ts` içine eklenir.
- Her public fonksiyonda kısa bir JSDoc bulunur.
- `systems/`, `state/`, `persistence/` altındaki kod DOM/Canvas'a
  dokunmaz; bu katmanlar %80+ satır kapsamasıyla test edilir.
- Anlamlı bir değişiklik yaptıysanız `CHANGELOG.md`'ye kısa bir giriş
  ekleyin (Keep a Changelog formatı).

## Güvenlik

Tehdit modeli ve alınan önlemler için [docs/SECURITY.md](docs/SECURITY.md)
dosyasına bakın.

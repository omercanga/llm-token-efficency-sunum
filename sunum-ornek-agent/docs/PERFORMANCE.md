# Performans Raporu (FAZ 5)

## Yöntem

- **Lighthouse**: üretim build'i (`npm run build && npm run preview`)
  üzerinde, masaüstü ön ayarıyla (`--preset=desktop`), headless Chrome
  ile çalıştırıldı:
  ```bash
  npm run build
  npm run preview -- --port 5185 &
  npx lighthouse http://localhost:5185/ \
    --output=html --output-path=./lighthouse-report \
    --chrome-flags="--headless=new --no-sandbox" \
    --preset=desktop
  ```
- **FPS**: Gerçek tarayıcıda (headless Chromium, patchright), sayfa
  yüklendikten sonra 3 saniye boyunca `requestAnimationFrame`
  çağrılarının sayılmasıyla ölçüldü (oyunun kendi game loop'u ile aynı
  döngü).

## Sonuçlar

| Kategori       | Skor      |
| -------------- | --------- |
| Performance    | 100 / 100 |
| Accessibility  | 100 / 100 |
| Best Practices | 100 / 100 |
| SEO            | 100 / 100 |

Temel metrikler:

| Metrik                   | Değer |
| ------------------------ | ----- |
| First Contentful Paint   | 0.2 s |
| Largest Contentful Paint | 0.3 s |
| Speed Index              | 0.3 s |
| Total Blocking Time      | 0 ms  |
| Cumulative Layout Shift  | 0     |
| Time to Interactive      | 0.3 s |

**FPS**: 3 saniyelik ölçümde 361 frame → ortalama **~120 FPS**
(test ortamının ekran tazeleme hızıyla sınırlı; NFR-1 hedefi olan
60 FPS'in rahatça üzerinde, ana thread'de bloklanma yok — TBT: 0ms).

## Yorum

- Uygulamanın sıfıra yakın çalışma zamanı bağımlılığı (bkz.
  [ADR-0001](adr/0001-render-technique.md)) ve küçük bundle boyutu
  (~11 KB JS, gzip ~4.3 KB) sayesinde yükleme metrikleri son derece
  düşük.
- Canvas 2D üzerinde çizilen birkaç düzine vektör şekli, orta seviye
  bir laptopta 60 FPS hedefini zorlamıyor; asıl darboğaz test ortamının
  görüntü tazeleme hızı (~120 Hz) oldu — bu da NFR-1'in rahatça
  karşılandığını gösteriyor.
- İlk taramada Lighthouse şu üç küçük bulguyu çıkardı, hepsi bu raporun
  hazırlandığı oturumda düzeltildi: eksik favicon (konsol 404 hatası),
  `<main>` landmark eksikliği, eksik `meta description` ve geçersiz
  `robots.txt` (dosya hiç yoktu, SPA fallback nedeniyle Lighthouse
  `index.html`'i robots.txt olarak yorumlamaya çalışıyordu).

## Nasıl tekrar üretilir

```bash
npm run build
npm run preview -- --port 5185 &
npx lighthouse http://localhost:5185/ --view --preset=desktop
```

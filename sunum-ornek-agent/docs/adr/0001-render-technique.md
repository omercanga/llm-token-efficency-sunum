# 0001 — Render Tekniği: TypeScript + Vite + Canvas 2D

## Durum

Kabul edildi

## Bağlam

Retro (80'ler arcade) bir yıldız savaş gemisi oyunu geliştiriliyor. Görsel
gereksinim (FAZ 0) vektör/şekil tabanlı çizim olarak netleşti: gemi, düşman
ve mermiler poligon/çizgi ile çizilecek, harici sprite/asset dosyası yok.
Performans hedefi orta seviye laptopta 60 FPS. Güvenlik politikası (FAZ 2)
minimum bağımlılık talep ediyor. Mimari, oyun mantığının DOM/render'dan
bağımsız kalmasını (saf fonksiyonlar, birim testlenebilirlik) şart koşuyor.

## Karar

Render katmanı için native **Canvas 2D API** kullanılacak; framework olarak
**Phaser kullanılmayacak**. Build aracı olarak **Vite**, dil olarak
**TypeScript (strict mode)** seçildi.

## Neden Phaser değil?

Phaser 3 olgun bir 2D oyun motorudur ve şu değerlendirmeler sonucu elendi:

- **Bağımlılık yüzeyi**: Phaser + transitive bağımlılıkları, FAZ 2'deki
  "minimum bağımlılık, `npm audit` CI'da zorunlu" politikasıyla çelişecek
  kadar büyük bir denetim yüzeyi ekliyor. Bu oyunun ihtiyacı olan tek şey
  birkaç şeklin çizimi ve çarpışma tespiti — bunun için tam bir motor
  gereksiz risk/bakım yükü demek.
- **Mimari uyumsuzluk**: Phaser'ın `Scene`/`GameObject` modeli mutable ve
  kendi render/update döngüsüne sıkı bağlıdır. Bizim mimarimiz ise
  immutable state + saf fonksiyonlarla çarpışma/skor/spawn sistemlerinin
  DOM'suz, Canvas'sız birim testlenebilir olmasını şart koşuyor (bkz.
  [0002](0002-state-management.md)). Phaser'ın GameObject'lerini bu şekilde
  saf/deterministik test etmek, motorun kendi soyutlamalarıyla
  boğuşmayı gerektirir.
- **Kapsamla orantısızlık**: Tilemap, fizik motoru, sahne grafiği gibi
  Phaser'ın asıl değer kattığı özelliklere bu oyunda ihtiyaç yok — sadece
  birkaç şekil, sabit zaman adımlı bir döngü ve basit AABB/çember
  çarpışma testi yeterli.
- **Tam kontrol**: Fixed-timestep game loop'u ve input sistemini kendimiz
  yazarak deterministik, test edilebilir bir çekirdek elde ediyoruz.

Buna karşılık Canvas 2D + hiçbir framework:

- Sıfır ek çalışma zamanı bağımlılığı → daha küçük denetim/güvenlik yüzeyi.
- Vektör/şekil çizimi için fazlasıyla yeterli performans (60 FPS hedefi,
  düşük onlarca varlık için Canvas 2D rahatlıkla yeterli — WebGL'e gerek
  yok, bu ölçekte WebGL sadece karmaşıklık ekler).
- Render fonksiyonu `render(ctx, state)` şeklinde saf bir fonksiyon olarak
  yazılabildiğinden, oyun mantığı ile render tamamen ayrışıyor.

## Sonuçlar

- Game loop, input yönetimi ve çizim primitifleri sıfırdan yazılacak
  (ekstra iş, ama tam kontrol sağlıyor).
- İleride tilemap/fizik/parçacık sistemi gibi ihtiyaçlar ölçek büyütürse,
  Phaser'a geçiş `docs/ROADMAP.md`'de bir "tetikleyici" olarak
  belgelenecek — bugün için gerekli değil.
- `engine/render` modülü dışında hiçbir modül Canvas context'e dokunmaz.

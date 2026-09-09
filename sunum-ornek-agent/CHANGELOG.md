# Changelog

Bu proje [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) biçimini
ve [Semantic Versioning](https://semver.org/) kurallarını izler.

## [Unreleased]

### Added

- Seviye atladıkça arka plan müziği tempoyu hızlandırır (`AudioManager.setMusicIntensity`):
  her seviyede nota aralığı biraz kısalır, belirli bir alt sınırın altına
  inmez; restart'ta tempo seviye 1'e sıfırlanır.
- Seviye geçişi artık görsel olarak da "hissettiriliyor": banner'a ek olarak
  o anda kısa bir ekran sarsıntısı (`SCREEN_SHAKE_LEVEL_UP_*`) ve tüm
  sahneyi ~400ms boyunca sönerek kaplayan, seviyeye göre farklı renkte bir
  flaş (`engine/levelFlash.ts`, `drawLevelFlash`) tetikleniyor — oyun
  akmaya devam ediyor, yalnızca anlık bir vurgu. Tarayıcıda uçtan uca
  doğrulandı: geçici olarak kısaltılmış bir dalgayla seviye 2'ye
  ulaşıldığında banner ("SEVİYE 2"), ekran sarsıntısı (canvas transform
  offseti) ve renkli flaş (ekran görüntüsü) aynı anda gözlemlendi.
- Sonsuz, kademeli zorlaşan dalga sistemi: HUD'da "DALGA: N" sayacı;
  3 dalgalık döngü her turda düşman hızını/skorunu ~%15 artırır.
- Düşman çeşitliliği: `zigzag` (sinüs dalgasıyla yatay kayan) ve `tank`
  (2 vuruş gerektiren, görsel olarak farklı) düşman türleri.
- Patlama efekti: düşman/oyuncu vurulunca kısa ömürlü, dağılan vektör
  parçacıkları (`systems/particles.ts`).
- Güç yükseltmeleri: düşman yok edilince ~%15 ihtimalle "hızlı ateş"
  veya "üçlü atış" power-up'ı düşer (bkz. aşağıda mühimmat bazlı
  sisteme geçiş). Tüm rastgelelik (`Math.random`) `updateGameState`'e
  enjekte edilebilir bir parametre olarak eklendi — saf/deterministik
  test edilebilirlik korundu (bkz. docs/adr/0002-state-management.md).
- Yeni ses efekti: power-up toplama (`powerUp` sfx).
- Düşman ateşi: `zigzag` ve `tank` düşmanları rastgele aralıklarla
  oyuncuya doğru mermi atar (`systems/enemyFiring.ts`); ateş sıklığı
  zorluk çarpanıyla birlikte artar.
- Seviye geçiş bildirimi: bir dalga tamamlanınca kısa süreliğine
  yumuşak geçişli (fade) bir "SEVİYE N" banner'ı görünür; oyun
  **durmaz**, yalnızca bir bildirimdir.
- "Tekrar Oyna": oyun sonu ekranına, oyunu sıfırdan başlatan bir
  düğme eklendi (`GameLoopHandle.reset`).
- Arka plan müziği: sessizce döngülenen, ritmik bir retro arcade bas
  riffi (Web Audio, harici dosya yok). Ateş sesleri (`fire`/`enemyFire`)
  daha yumuşak bir dalga biçimine (triangle) ve daha kısık seviyeye
  çekildi.
- İki yeni düşman türü: `diver` (ekranın belirli noktasından sonra
  oyuncunun anlık x konumuna doğru dalışa geçer) ve `boss` (diğerlerinden
  çok daha büyük — 44×44 — 5 vuruşluk, ateş eden, en yüksek puanlı
  düşman). Her düşman türü artık kendine özgü bir vektör silüetle
  çizilir (elmas, dar ok, geniş kanatlı vb.) — yalnızca renkle değil.
- İki yeni power-up: `pierce` (mermi bir düşmana çarpınca yok olmadan
  yoluna devam eder, aynı karede hizalı birden fazla düşmana isabet
  edebilir) ve `shield` (aktifken çarpışmalar canı azaltmaz; oyuncunun
  etrafında bir halka olarak görselleştirilir). Ayrıca anlık etkili
  (buff değil) bir `extraLife` power-up'ı: alınır alınmaz +1 can
  kazandırır. Toplam 5 power-up türü artık ağırlıklı bir olasılık
  tablosuyla seçiliyor (`systems/powerUpSpawn.ts`).
- Buff'lar artık süreyle değil **mühimmatla** tükeniyor: rapidFire/
  multiShot/pierce her ateşte 1 azalır, shield her isabette 1 azalır.
  Kalan mühimmat, geminin hemen üzerinde renkli bir çubukla gösterilir
  (`engine/render.ts` — `drawBuffChargeBar`).
- Ekran sarsıntısı (`engine/screenShake.ts`): oyuncu isabet alınca
  küçük, yüksek puanlı bir düşman (ör. boss) yok olunca daha büyük bir
  sarsıntı — çarpışmalara "hissedilir" bir ağırlık katar.

Tarayıcıda uçtan uca doğrulandı: 5 düşman türü de görsel olarak
birbirinden tamamen farklı render ediliyor (özellikle "boss" belirgin
şekilde daha büyük), rapidFire/multiShot/shield/extraLife power-up'ları
ekranda görüldü ve alındı, konsol hatası yok.

### Fixed

- Oyun bitince arka plan müziği durmuyordu ve "Tekrar Oyna" ile yeni bir
  oyun başlatılınca ikinci bir müzik döngüsü (ve ikinci bir
  `AudioContext`) daha üst üste çalmaya başlıyordu. Kök neden:
  `attachLazyAudio`, `keydown` ve `pointerdown` için birbirinden
  bağımsız iki `{ once: true }` dinleyici kullanıyordu — biri tetiklenip
  kendini kaldırdığında diğeri hâlâ takılı kalıyor, "Tekrar Oyna"
  düğmesine tıklama gibi ikinci bir etkileşim ikinci sesi tetikliyordu.
  Artık paylaşılan bir `started` bayrağı her iki dinleyiciyi de ilk
  etkileşimde birlikte kaldırıyor; ayrıca `gameOver` olayında
  `stopMusic()`, "Tekrar Oyna"da `startMusic()` çağrılıyor. Mantık
  `engine/lazyAudio.ts`'e ayrıştırılıp `AudioContext`/`AudioManager`
  oluşturma enjekte edilebilir bir bağımlılık haline getirildi — bu,
  gerçek bir tarayıcı/Web Audio olmadan `lazyAudio.test.ts`'te
  deterministik olarak doğrulandı (keydown→pointerdown ve
  pointerdown→keydown sıralarının hiçbirinde ikinci bir ses
  oluşturulmadığı testlerle kanıtlandı).

## [0.1.0] - 2026-09-07

### Added

- FAZ 0-3: gereksinim analizi, ADR'ler, STRIDE tehdit modeli, proje
  iskeleti ve kalite kapıları (lint, typecheck, test, build, audit, CI,
  pre-commit).
- Dilim 1: sabit zaman adımlı (1/60s) game loop, kayan nokta hatasını
  biriktirmeyen `advanceFixedTimestep`, boş sahne render (retro paralaks
  yıldız alanı).
- Dilim 2: oyuncu hareketi (4 yön, çapraz normalize, oynanabilir alana
  kelepçeli) ve yeniden atanabilir tuş eşlemesi (`InputManager`,
  `KeyboardEvent.code` tabanlı, `setBindings` ile çalışma zamanında
  değiştirilebilir).
- Dilim 3: mermi ateşleme (cooldown'lu), düşman varlığı, AABB tabanlı
  `collision` sistemi (mermi↔düşman, düşman↔oyuncu) ve `scoring`
  sistemi; can sıfıra düşünce `gameOver` durumuna geçiş. Tüm sistemler
  saf fonksiyon olarak %100 satır/dal kapsamıyla test edildi.
- Dilim 4: veri-güdümlü dalga/spawn sistemi (`src/data/waves.json`).
  Dalga bitip ekran temizlenince bir sonraki dalgaya (döngüsel) geçilir.
  `update` artık ADR-0002'de belgelenen move → collision → spawn →
  scoring sırasını izliyor.
- Dilim 5: DOM tabanlı HUD (skor/can, yalnızca `textContent`) ve oyun
  sonu ekranı (`ui/`).
- Dilim 6: `HighScoreStorage` arayüzü ve `localStorage` adaptörü
  (bozuk/kurcalanmış veriye karşı dayanıklı, şema doğrulamalı, en
  fazla `MAX_STORED_HIGH_SCORES` kayıt saklar), isim doğrulama
  (`validatePlayerName` — maks. 12 karakter, yalnızca harf/rakam/
  boşluk, sessiz kırpma yok) ve oyun sonu ekranına isim girişi +
  yüksek skor listesi. Tarayıcıda uçtan uca doğrulandı: oyun bitince
  geçersiz isim reddediliyor, geçerli isim kaydedilip listede görünüyor.
- Dilim 7: retro vektör gemi çizimleri (oyuncu/düşman artık dolgu
  dikdörtgen değil, glow'lu vektör yol ile çizilen gemiler) ve Web
  Audio API ile prosedürel ses efektleri (ateş, patlama, isabet, oyun
  sonu). Ses, yalnızca ilk kullanıcı etkileşiminden (tuş/tıklama)
  sonra `AudioContext` oluşturularak başlatılır (tarayıcı autoplay
  politikası). `GameState.events` alanı, saf `update` fonksiyonunun
  DOM/Audio'ya dokunmadan yan etkileri "bildirmesini" sağlar.
- FAZ 5: `docs/TEST-PLAN.md` (10 manuel senaryo) ve `docs/PERFORMANCE.md`
  (Lighthouse: 100/100/100/100, ~120 FPS ölçümü).
- FAZ 6: `docs/ROADMAP.md` (online skor tablosu/çok oyunculu mod için
  hangi modüllerin değişip değişmeyeceği) ve `docs/RUNBOOK.md` (bilinen
  sorunlar, hata ayıklama, sürüm çıkarma adımları).

### Fixed

- `#game-over` öğesi, `hidden` özniteliği true olsa bile her zaman
  görünür kalıyordu (CSS özgüllük çakışması: ID seçicisi tarayıcının
  varsayılan `[hidden]` kuralını eziyordu).
- Aynı özgüllük hatası `.game-over__form` için de vardı — skor
  gönderildikten sonra form gizlenmiyordu.
- Lighthouse taraması sırasında bulunan küçük eksiklikler giderildi:
  eksik favicon (konsol 404 hatası), `<main>` landmark'ı, eksik
  `meta description`, geçersiz `robots.txt`.

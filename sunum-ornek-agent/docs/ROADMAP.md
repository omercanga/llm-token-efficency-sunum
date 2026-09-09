# Yol Haritası — Online Skor Tablosu ve Çok Oyunculu Mod

Bu belge, v1 mimarisinin (bkz. [docs/adr/](adr/)) planlanan iki büyüme
yönü için hangi modülleri **değiştirmeden** destekleyeceğini ve hangi
modüllerin **değişmesi/eklenmesi** gerektiğini belgeler. Amaç: bu
genişlemeler geldiğinde şaşırmamak ve bugünden "gereksiz" esneklik
eklememek (YAGNI) — mimari zaten doğru sınırları çizdiği için hazır.

## Değişmeyecek Modüller

| Modül                                                      | Neden değişmeyecek                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state/` (immutable `GameState`, saf `update`)             | Deterministik saf fonksiyonlar; online modda sunucu-otorite doğrulaması veya çok oyunculuda lockstep/rollback netcode, state'in serileştirilebilir ve yeniden üretilebilir olmasını gerektirir — bu zaten baştan böyle tasarlandı (bkz. [ADR-0002](adr/0002-state-management.md)). |
| `systems/` (collision, scoring, spawn, movement, shooting) | Oyun kuralları transport'tan (yerel/online/çok oyunculu) bağımsızdır; bu fonksiyonlar bugün de yarın da aynı girdi/çıktı sözleşmesiyle çalışır.                                                                                                                                    |
| `entities/`                                                | Oyuncu/düşman/mermi veri şekilleri değişmez; çok oyunculuda yalnızca "kaç tane Player instance'ı var" değişir (aşağıya bakın).                                                                                                                                                     |
| `persistence/` **arayüzü** (`HighScoreStorage`)            | Zaten "bugün localStorage, yarın REST/WebSocket" öngörüsüyle tasarlandı (bkz. [ADR-0003](adr/0003-persistence-abstraction.md)); arayüz sözleşmesi değişmez, yalnızca yeni bir adaptör eklenir.                                                                                     |
| `config/constants.ts` yapısı                               | Yeni sabitler eklenebilir ama mevcutların anlamı/organizasyonu değişmez.                                                                                                                                                                                                           |

## Online Skor Tablosu İçin Değişecek/Eklenecek

- **Yeni**: `persistence/restHighScoreAdapter.ts` — `HighScoreStorage`
  arayüzünü bir REST API üzerinden implement eder. `main.ts`'te hangi
  adaptörün kullanılacağı (localStorage vs REST) bir konfigürasyon
  noktasından seçilir; `state/`, `systems/`, `ui/` kodlarında **hiçbir
  değişiklik gerekmez**.
- **Değişecek**: `docs/SECURITY.md` — bugün "kabul edilen risk" olan
  client-side skor kurcalanması, online modda **zorunlu sunucu tarafı
  doğrulamaya** dönüşür. `HighScoreEntry.schemaVersion` alanı zaten bu
  geçişe hazır (versiyon bazlı doğrulama/migration mümkün).
- **Değişecek**: `ui/gameOverScreen.ts` — ağ hatası/gecikme durumları
  için bir yükleniyor/hata göstergesi eklenmesi gerekir (bugün
  senkron localStorage yazımı anında sonuçlanıyor, REST çağrısı
  asenkron gecikme+hata içerebilir — arayüz zaten `Promise` tabanlı
  olduğu için bu değişiklik yalnızca `ui/` katmanında kalır).

## Çok Oyunculu Mod İçin Değişecek/Eklenecek

- **Yeni**: `engine/network.ts` — WebSocket bağlantısı, sunucudan gelen
  state güncellemelerini/girdi olaylarını iletme. Bu tamamen yeni bir
  modül; bugün hiçbir şeyi bozmaz.
- **Değişecek (kırıcı)**: `state/gameState.ts` — `player: Player` tekil
  alanı `players: readonly Player[]` (veya `Record<PlayerId, Player>`)
  olacak şekilde genişletilmesi gerekir. Bu, tek oyunculu varsayımı
  taşıyan tek gerçek kırılma noktasıdır ve bilinçli olarak bugünden
  soyutlanmadı (YAGNI — "ileride belki" için bugün karmaşıklık
  eklemek yerine, bu noktayı burada belgelemek tercih edildi).
- **Değişecek**: `systems/collision.ts`, `systems/movement.ts` — tekil
  `player: Player` parametresi yerine oyuncu listesi/haritası üzerinde
  çalışacak şekilde genellenmesi gerekir (iş mantığı aynı kalır,
  yalnızca imza değişir).
- **Yeni**: `ui/lobby.ts` (veya benzeri) — oda/eşleştirme ekranı,
  bağlantı durumu göstergesi.
- **Değişmeyecek**: `entities/player.ts`, `entities/enemy.ts`,
  `entities/bullet.ts` — veri şekilleri aynı kalır, yalnızca kaç
  instance olduğu değişir.
- **Karar noktası (o zaman verilecek)**: Sunucu-otorite mi (sunucu
  simülasyonu yürütür, istemci yalnızca render eder) yoksa lockstep mi
  (her istemci aynı deterministik `update`'i çalıştırır, yalnızca
  girdiler senkronize edilir)? `update`'in saf ve deterministik olması
  (bkz. ADR-0002) her iki yaklaşımı da destekler — bu karar bugünden
  verilmedi, gereksiz erken bağlayıcılık yaratmamak için.

## Tetikleyiciler (Bu Geriye Dönüp Bakılacak Noktalar)

- **Render tekniği** ([ADR-0001](adr/0001-render-technique.md)):
  tilemap/fizik motoru/parçacık sistemi ihtiyacı ortaya çıkarsa
  Phaser'a geçiş yeniden değerlendirilmeli — bugün için gerekli değil.
- **State boyutu**: oyuncu sayısı/varlık sayısı önemli ölçüde artarsa
  (çok oyunculu ile birlikte), her frame yeni obje/array allocasyonu
  (bkz. ADR-0002 "Sonuçlar") GC baskısı yaratabilir — profiling
  gerekirse object pooling değerlendirilmeli.

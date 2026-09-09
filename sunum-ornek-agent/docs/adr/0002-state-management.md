# 0002 — State Yönetimi: Immutable Game State + Saf Fonksiyonlar

## Durum

Kabul edildi

## Bağlam

FAZ 4 kuralı: "Oyun mantığı DOM'a dokunmaz" ve "Çarpışma, skor ve spawn
sistemlerinde %80+ satır kapsaması" gerekiyor — bu da bu sistemlerin
Canvas/DOM olmadan, saf girdi→çıktı şeklinde birim testlenebilir olmasını
gerektiriyor. Ayrıca proje ileride online skor tablosu ve çok oyunculu
moda genişleyecek (NFR-4); bu tür genişlemeler genellikle durumun
serileştirilebilir/deterministik olmasını (ör. netcode için state
snapshot/rollback) gerektirir.

## Karar

Oyunun tüm durumu tek bir **immutable `GameState`** nesnesinde tutulur.
Her frame'de yeni bir state üretilir:

```typescript
type GameState = {
  player: Player;
  enemies: readonly Enemy[];
  bullets: readonly Bullet[];
  score: number;
  lives: number;
  wave: number;
  status: 'playing' | 'gameOver';
};

function update(state: GameState, input: InputSnapshot, dt: number): GameState;
```

`update`, alt sistemleri (`moveSystem`, `collisionSystem`, `spawnSystem`,
`scoringSystem`) sırayla çağıran saf bir fonksiyondur; her alt sistem de
kendisi saf bir `(state, args) => partialState` fonksiyonudur. Önceki
state hiçbir zaman mutasyona uğramaz — her sistem yeni obje/array üretir.
Render katmanı yalnızca state'i **okur**, hiçbir zaman yazmaz.

## Alternatifler

- **Mutable OOP entity'ler** (`enemy.update()` gibi metodlarla kendi
  kendini güncelleyen sınıflar): Birçok oyun motorunda idiomatik olsa da,
  deterministik birim test yazmayı ve state'i disipline etmeyi
  zorlaştırır; ileride multiplayer için gereken state
  snapshot/serialize/rollback işini karmaşıklaştırır. Reddedildi.
- **Harici state kütüphanesi** (Redux, Zustand, Immer): Bu ölçekte basit
  bir elle yazılmış reducer deseni yeterli; FAZ 2'nin minimum bağımlılık
  politikasıyla çelişir. Reddedildi.
- **Immutable state + saf fonksiyonlar (seçilen)**: Ekstra bağımlılık
  yok, tam test edilebilirlik, gelecekteki netcode ihtiyaçlarına doğal
  uyum.

## Sonuçlar

- `systems/` ve `state/` içindeki her fonksiyon Canvas/DOM olmadan,
  düz girdi/çıktı ile test edilebilir → %80+ kapsama hedefi doğal olarak
  karşılanır.
- Her frame'de yeni obje/array allocasyonu GC baskısı yaratabilir; bu
  ölçekteki varlık sayısında (birkaç düzine mermi/düşman) 60 FPS hedefi
  için sorun teşkil etmesi beklenmiyor. Profiling'de GC duraklaması
  görülürse object pooling değerlendirilecek (bugün uygulanmayacak,
  YAGNI).
- İleride online/multiplayer eklenirken, `update` fonksiyonunun saf ve
  deterministik olması, sunucu-otorite veya lockstep gibi modellere
  geçişi kolaylaştırır — bu ADR'nin ana motivasyonlarından biri budur.

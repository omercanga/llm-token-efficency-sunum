# 0003 — Depolama Soyutlaması: Persistence Arayüzü

## Durum

Kabul edildi

## Bağlam

Bugün yüksek skorlar `localStorage`'da tutulacak; ileride online skor
tablosu (REST/WebSocket) eklenmesi planlanıyor (NFR-4). Oyun mantığı,
skorun _nasıl_ saklandığını bilmemeli. Ayrıca skor verisi client-side
kurcalanabilir bir veridir (bkz. FAZ 2 tehdit modeli, `docs/SECURITY.md`);
bugün imzalama/sunucu doğrulaması yapılmasa da, ileride buna kolayca
geçilebilecek **versiyonlu bir şema** baştan tanımlanmalı.

## Karar

`persistence/` modülünde depolamadan bağımsız bir arayüz tanımlanır;
oyun/UI katmanı yalnızca bu arayüze bağımlıdır, somut adaptöre değil
(Dependency Inversion). Bugün için `LocalStorageHighScoreAdapter` bu
arayüzü implement eder; yarın `RestHighScoreAdapter` veya
`WebSocketHighScoreAdapter` aynı arayüzü implement edip constructor/factory
üzerinden enjekte edilir — çağıran kodda değişiklik gerekmez.

```typescript
export interface HighScoreEntry {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly score: number;
  readonly achievedAt: string; // ISO-8601 tarih
}

export interface HighScoreStorage {
  getTopScores(limit: number): Promise<HighScoreEntry[]>;
  submitScore(entry: Omit<HighScoreEntry, 'schemaVersion'>): Promise<void>;
}
```

`schemaVersion` alanı, ileride sunucu tarafı doğrulama/migration
eklendiğinde eski/yeni istemcilerin ayırt edilebilmesi için baştan
konur.

## Alternatifler

- **Doğrudan `localStorage` çağrıları oyun/UI kodunda**: En basit yol,
  ama REST'e geçişte her çağrı noktasının bulunup değiştirilmesi
  gerekir; test etmek için `localStorage`'ı mock'lamak zorunlu kalır.
  DIP ihlali. Reddedildi.
- **Senkron arayüz** (`localStorage` senkron olduğu için `Promise`
  kullanmamak): `localStorage` senkron olsa da REST/WebSocket zorunlu
  olarak asenkrondur. Arayüzü baştan senkron tasarlarsak, adaptör
  değiştiğinde arayüzün kendisi de (dolayısıyla çağıran kod) değişmek
  zorunda kalır — bu tam da önlemeye çalıştığımız şey. Reddedildi.
- **`async` arayüz + versiyonlu şema (seçilen)**: Bugünden itibaren
  tüm çağrılar `await` edilir (yerel senaryoda bile), adaptör
  değişikliği oyun mantığını etkilemez.

## Sonuçlar

- Test edilebilirlik: birim testlerde gerçek `localStorage` yerine
  in-memory sahte (`FakeHighScoreStorage`) adaptör kullanılabilir.
- Genişleme: online skor tablosu eklenirken sadece yeni bir adaptör
  yazılır ve uygulama başlangıcında seçilir (`docs/ROADMAP.md`'de bu
  geçiş noktası belgelenecek); `state/`, `systems/`, `ui/` kodlarında
  değişiklik gerekmez.
- Güvenlik: `submitScore` sınırındaki isim alanı (`name`) UI katmanında
  sanitize/validate edildikten sonra buraya ulaşır (bkz.
  `docs/SECURITY.md`) — bu arayüz kendi başına giriş doğrulaması
  yapmaz, çağıranın sorumluluğundadır (net sınır ayrımı).

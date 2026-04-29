# Disco 101 – Finale Spezifikation für Claude

## 1. Produkt-Überblick

**Disco 101** ist eine Sprachlern-App für deutsche Urlauber, die Englisch lernen möchten. Die App enthält **101 essentielle Sätze** für typische Urlaubssituationen (Ankunft, Hotel, Restaurant, Small Talk, Shopping, Notfälle). Jeder Satz wird von zwei Sprechern (männlich "Chris", weiblich "Ann") im britischen Englisch vorgelesen. Die App ist komplett offline nutzbar.

**Kernversprechen:** *"101 Sätze – mehr brauchst du nicht für deine Reise."*

## 2. Paket-Struktur & Preise (Einmalkäufe, kein Abo)

| Paket | Inhalt | Preis |
|-------|--------|-------|
| **Disco 101 (Basis)** | Kapitel 1–7 (101 Sätze) | 9,99 € |
| **Disco 102** | Kapitel 8–14 (101 weitere Sätze) | 9,99 € |
| **Disco 103 – Business** | Kapitel 15–21 (101 Business-Sätze) | 9,99 € |
| **Disco 104 – Expats** | Kapitel 22–28 (101 Sätze für Behörden, Arzt etc.) | 9,99 € |
| **Komplett-Bundle** | Alle 4 Pakete (28 Kapitel, 404 Sätze) | 34,99 € |

## 3. Gratis-Testphase (7 Tage)

- Jeder Nutzer erhält **7 Tage vollen Zugriff** auf Disco 101 (Basis).
- Nach 7 Tagen: Nur noch Kapitel 1 (15 Sätze) kostenlos.
- Erweiterungen sind während der Testphase gesperrt (nur sichtbar).

## 4. Präsentation der Erweiterungen

**Tab "More":** Unten in der Navigation (Icon: Schloss). Enthält Kacheln für 102, 103, 104 und Bundle.

**Learn-Seite (Ende):** Unter Kapitel 7: Trennlinie, Überschrift "Mehr entdecken", gleiche Kacheln.

Keine Pop-ups, kein künstlicher Druck.

## 5. Buch bei Amazon KDP

- Titel: `Disco 101 – Dein englischer Urlaubsbegleiter`
- Preis: 8,99 €, 60 Seiten, nur Disco 101 (Basis)
- QR-Code für 7 Tage Gratis-Zugang (gleicher Code `DISCO101BOOK`)

## 6. Technische Umsetzung

- Alle MP3s (4 Pakete) von Anfang an in `assets/audio/`.
- Non-Consumable In-App-Käufe für jedes Paket und Bundle.
- Flags in AsyncStorage: `userOwnsDisco101`, `userOwnsDisco102`, etc.
- App komplett offline-fähig.

## 7. Audio-Optimierung

Siehe separate Datei `CLAUDE_AUDIO_OPTIMIZATION.md`.
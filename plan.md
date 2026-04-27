# Disco 101 – Projektplan & Referenzdokument

> Dieses Dokument ist die **einzige Quelle der Wahrheit** für das Disco101-Projekt.
> Cursor und Claude beziehen sich immer auf dieses Dokument.
> Letzte Aktualisierung: April 2026

---

## 1. Projektidee & Vision

**Disco 101** ist ein einfacher, fokussierter Sprachtrainer für Urlaubsreisende.
Kern: **101 essentielle Redewendungen** Deutsch → Englisch.
Kein Grammatik-Unterricht, kein Gamification-Overload – nur das Wesentliche.

**Kernversprechen:** Nach 101 Phrasen + einfachen Tests kannst du dich im Urlaub verständigen.

**Brand-Skalierung (Zukunft):**
- Disco 101 Spanisch, Italienisch, Französisch
- Disco 102, 103 → Aufbau-Vokabular
- Disco 101 Business → spezifische Bereiche (Meetings, Medizin, etc.)
- Reverse-Richtungen (Englisch → Deutsch) als separates Produkt
- Zu jeder App eine Buch-Version (Amazon KDP)

---

## 2. Design

### 2.1 Farbschema (fix)
| Element | Farbe | Hex |
|---|---|---|
| Karten-Hintergrund | Dunkelgrün | `#1B5E38` |
| Primäre Zahl / Akzent | Gelb | `#FFDC3E` |
| Haupttext (englische Phrase) | Weiß | `#FFFFFF` |
| Sekundärtext (deutsche Übersetzung) | Weiß 55% | `rgba(255,255,255,0.55)` |
| App-Hintergrund | Hell / Cremeweiß | `#F0EDEA` |
| Weiter-Button | Gelb | `#FFDC3E` |
| Button-Text | Dunkelgrün | `#1B3A20` |
| Fortschrittsbalken | Gelb | `#FFDC3E` |

### 2.2 Typografie
- **Display / Zahlen:** DM Serif Display
- **UI / Text:** DM Sans

### 2.3 Karten-Konzept
- Jede Phrase erscheint als **grüne Karte** auf hellem Hintergrund
- Gibt dem User das Gefühl ein Kärtchen abgearbeitet zu haben
- Navigation: **Button** (kein Wischen) – Zielgruppe inkl. ältere User

### 2.4 Avatare
- Zwei Sprecher dargestellt als **Monogramm-Buttons**
- **M** (Male) und **F** (Female) – gelbe Schrift auf grünem Kreis
- Namen der Avatare: noch offen
- Kein Emoji, kein aufwändiger Charakter

### 2.5 Markierung / Wiederholung
- **Stern ⭐** (kein Bookmark, keine Flagge) zum Markieren unsicherer Phrasen
- Stern ist **kostenlos** für alle User
- **Wiederholungs-Modus** (nur markierte Karten) → Premium

---

## 3. App-Struktur

### 3.1 Screens
| Screen | Beschreibung |
|---|---|
| `Home` | Übersicht aller 7 Kapitel, Gesamtfortschritt |
| `Learn` | Grüne Phrasen-Karte mit Audio-Buttons |
| `Test` | Test nach jedem Kapitel (siehe 3.3) |
| `Review` | Wiederholung markierter Phrasen (Premium) |
| `Paywall` | Upgrade-Screen |
| `Settings` | Einfache Einstellungen |

### 3.2 Navigation (Bottom Tabs)
```
🏠 Home  |  📖 Lernen  |  ⭐ Wiederholen  |  ⚙️ Settings
```

### 3.3 Test-Konzept (fix)
1. Oben: Kurze Info – „Test · Kapitel 1 · 5 Fragen"
2. Drei deutsche Übersetzungen erscheinen → **verschwommen / nicht anklickbar**
3. Unten: Avatar **M** und **F**
4. User tippt auf einen Avatar → Audio spielt ab → Antworten werden **scharf und anklickbar**
5. User wählt die richtige Übersetzung
6. Richtige Antwort leuchtet **gelb** auf → falsche verblassen
7. 5 Fragen pro Test · 4/5 richtig = bestanden
8. Ergebnis-Screen mit Score

### 3.4 Kapitel
| Nr | Titel | Phrasen |
|---|---|---|
| 1 | Ankunft & Orientierung | 15 |
| 2 | Unterkunft | 12 |
| 3 | Essen & Trinken | 20 |
| 4 | Small Talk & Höflichkeit | 18 |
| 5 | Shoppen & Service | 15 |
| 6 | Notfall & Gesundheit | 8 |
| 7 | Verstehen & Nachfragen | 13 (inkl. Bonus #101) |

---

## 4. Monetarisierung

### 4.1 Modell
- **3 Tage gratis:** Alle 101 Phrasen können durchgeklickt werden · Test nur Kapitel 1
- **Ab Tag 4:** Paywall für Tests Kapitel 2–7 und Wiederholungs-Modus
- **Kein Account nötig** für Free-Version

### 4.2 Preise
| Plan | Preis |
|---|---|
| Monatlich | € 6,99 / Monat |
| Jährlich | € 45,99 / Jahr (≈ € 3,83/Mo) |
| Lifetime | € 59,99 einmalig |

### 4.3 Buch-Integration (später)
- Taschenbuch via Amazon KDP · ca. 60 Seiten · € 8,99
- QR-Code im Buch → Deep Link `disco101://redeem?code=DISCO101BOOK`
- Schaltet 30 Tage Premium frei

### 4.4 Premium-Features
- Tests Kapitel 2–7
- Wiederholungs-Modus (markierte Phrasen via Stern)
- Cloud-Sync Fortschritt (später, via Firebase)

---

## 5. Technischer Stack

| Bereich | Technologie |
|---|---|
| Framework | Expo (React Native) |
| Routing | Expo Router (dateibasiert) |
| State | Zustand |
| Persistenz | AsyncStorage (lokal) · Firebase (später) |
| Audio | expo-av |
| In-App-Käufe | expo-in-app-purchases |
| Schriften | DM Serif Display · DM Sans (Google Fonts) |

---

## 6. Dateistruktur

```
Disco101/
│
├── plan.md                        ← dieses Dokument
│
├── app/                           ← Expo Projekt
│   ├── app/                       ← Expo Router Screens
│   │   ├── index.tsx              ← Home Screen
│   │   ├── learn/
│   │   │   └── [chapterId].tsx    ← Lernscreen
│   │   ├── test/
│   │   │   └── [chapterId].tsx    ← Testscreen
│   │   ├── review.tsx             ← Wiederholung (Premium)
│   │   ├── paywall.tsx            ← Paywall
│   │   └── settings.tsx           ← Einstellungen
│   │
│   ├── components/
│   │   ├── PhraseCard.tsx         ← grüne Karte
│   │   ├── AvatarButton.tsx       ← M / F Button
│   │   ├── AnswerOption.tsx       ← Antwort im Test
│   │   └── ProgressBar.tsx
│   │
│   ├── store/
│   │   └── progress.ts            ← Zustand Store
│   │
│   ├── data/
│   │   └── sentences.json         ← alle 101 Phrasen
│   │
│   └── assets/
│       └── audio/                 ← 001_m.mp3 ... 101_f.mp3
│
└── book/                          ← später, KDP Buch
```

---

## 7. MVP-Abgrenzung

**Im MVP enthalten:**
- Alle 101 Phrasen durchklickbar
- Audio (pre-recorded MP3, male + female)
- Test nach Kapitel 1 (kostenlos)
- Paywall nach 3 Tagen
- Stern-Markierung
- Lokaler Fortschritt (AsyncStorage)

**Nicht im MVP:**
- Cloud-Sync
- Buch-Deep-Link
- Wiederholungs-Modus (kommt kurz nach MVP)
- Weitere Sprachen
- Account-System

---

## 8. Offene Punkte

- [ ] Namen der Avatare M und F (oder anonym belassen)
- [ ] Audio-Produktion (ElevenLabs oder Google TTS)
- [ ] App Store / Google Play Account einrichten
- [ ] Firebase Projekt anlegen (für spätere Cloud-Sync)
- [ ] Buch-Design (nach App-Launch)

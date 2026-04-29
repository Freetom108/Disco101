# Disco 101 – Audio-Optimierung für Claude

## 1. MP3-Qualität (bereits erfüllt)

- Bitrate: 128 kbps
- Samplerate: 44,1 kHz
- Format: MP3

## 2. Empfohlene Optimierungen (Priorität 1 zuerst)

### A. Fehlerbehandlung (höchste Priorität)

Umgebe `await sound.playAsync()` mit `try-catch`. Bei Fehler: Zeige Toast-Nachricht ("Kann Audio nicht abspielen") und logge Fehler. App darf nicht abstürzen.

### B. Overlap-Schutz

Prüfe vor Abspielen, ob bereits ein Sound läuft. Falls ja: `await sound.stopAsync()`. Deaktiviere Button während des Ladens. Verwende `.replayAsync()` statt `.playAsync()`.

### C. Preloading (für null Verzögerung)

Lade alle MP3s eines Kapitels vor, sobald Nutzer das Kapitel öffnet. Speichere Sound-Objekte im Cache (useRef/useState). Entlade, wenn Kapitel verlassen wird.

### D. Entladen von Sounds (Speichermanagement)

Bei Verlassen der Karte oder App-Hintergrund: `sound.unloadAsync()` im useEffect-Cleanup.

## 3. Claude-Prompt für Audio-Komponente

> "Baue einen SpeakerButton, der:
> 1. MP3 aus `assets/audio/` abspielt (Key: `{phraseId}_{letter}`)
> 2. Fehler abfängt und Toast zeigt
> 3. Overlap vermeidet (stop vor neuem Play)
> 4. Preloading pro Kapitel unterstützt (optional)
> 5. Speicher beim Verlassen freigibt"

## 4. Wichtiger Hinweis

Die MP3s selbst sind in Ordnung – keine Konvertierung nötig.
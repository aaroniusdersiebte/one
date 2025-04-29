MiniPlaner - Projektbeschreibung
Übersicht
MiniPlaner ist eine Electron-basierte Desktop-Anwendung für Aufgabenplanung und Notizenverwaltung mit besonderem Fokus auf Produktivität und Workflow-Integration. Die App wurde mit React und Tailwind CSS entwickelt und bietet folgende Hauptfunktionalitäten:

Aufgabenverwaltung mit Gruppen und Unteraufgaben
Notizensystem
Fokus-Modus für konzentriertes Arbeiten
OBS-Integration für Streamer
Anpassbare Einstellungen

Projektstruktur
miniplaner/
├── build/                 # Kompilierte Anwendung
├── electron/              # Electron-spezifische Dateien
│   ├── main.js            # Hauptprozess der Electron-App
│   └── preload.js         # Preload-Skript für IPC-Kommunikation
├── public/                # Statische Dateien
├── src/
│   ├── components/        # React-Komponenten
│   │   ├── focus/         # Fokus-Modus Komponenten
│   │   ├── notes/         # Notizen-Komponenten
│   │   ├── obs/           # OBS-Integration Komponenten
│   │   ├── settings/      # Einstellungs-Komponenten
│   │   ├── sidebar/       # Seitenleiste Komponenten
│   │   └── tasks/         # Aufgaben-Komponenten
│   ├── obs-templates/     # Templates für OBS-Integration
│   ├── services/          # Backend-Dienste
│   │   ├── obsService.js  # OBS-Verbindungsdienst
│   │   ├── settingsService.js # Einstellungsverwaltung
│   │   └── webServerService.js # Integrierter Webserver für OBS
│   ├── store/             # Zustand-Management
│   │   └── appStore.js    # Zentraler Zustandsspeicher (Zustand)
│   ├── styles/            # CSS-Dateien
│   ├── utils/             # Hilfsfunktionen
│   ├── App.jsx            # Hauptkomponente der Anwendung
│   └── index.js           # Einstiegspunkt
└── package.json           # Projekt-Abhängigkeiten
Hauptkomponenten und deren Funktionen
Kernanwendung

App.jsx: Hauptkomponente, die das Layout und die Drag & Drop-Funktionalität verwaltet
MainContent.jsx: Zeigt den Hauptinhalt je nach ausgewählter Ansicht an

Aufgabenverwaltung

TaskList.jsx: Listet Aufgaben an
Task.jsx: Einzelne Aufgabenkomponente mit Unteraufgaben, Tags und mehr
SubtaskList.jsx/SubtaskDraggableList.jsx: Verwaltung von Unteraufgaben
TrelloView.jsx: Kanban-Board-Ansicht für Aufgaben

Notizen

NotesList.jsx: Liste aller Notizen
Note.jsx: Einzelne Notizkomponente
NoteModal.jsx: Modal zum Erstellen/Bearbeiten von Notizen

Fokus-Modus

FocusMode.jsx: Fokus-Modus-Interface mit Timer und Details
MinimizedFocus.jsx: Minimierte Ansicht des Fokus-Modus
FocusSubtaskList.jsx: Unteraufgaben im Fokus-Modus

OBS-Integration

ObsPreview.jsx: Vorschau der OBS-Anzeige
OBSSettings.jsx: Einstellungen für die OBS-Integration

Seitenleiste

Sidebar.jsx: Hauptnavigation und Gruppenverwaltung
QuickActions.jsx: Schnellzugriff auf häufig genutzte Funktionen
DailyStats.jsx: Tägliche Statistiken zur Produktivität

Einstellungen

SettingsPanel.jsx: Haupteinstellungspanel
GeneralSettings.jsx: Allgemeine Einstellungen
OBSSettings.jsx: OBS-Integration-Einstellungen

Backend-Dienste

obsService.js: Verbindung mit OBS über WebSockets
settingsService.js: Einstellungsverwaltung mit electron-store
webServerService.js: Eingebetteter Webserver für OBS-Integration

Datenmanagement

appStore.js: Zentraler Zustandsspeicher mit Zustand (ähnlich Redux)

Verwaltet Gruppen, Aufgaben, Tags, Notizen und Einstellungen
Enthält alle Geschäftslogik für CRUD-Operationen



Elektronenspezifische Module

main.js: Hauptprozess für Electron, verwaltet Fenster und IPC
preload.js: Stellt sichere IPC-Brücke zwischen Renderer und Hauptprozess bereit

Beliebte Bearbeitungsszenarien
Aufgabenverwaltung erweitern

src/components/tasks/Task.jsx - Für Änderungen am Aufgabendesign/-funktionalität
src/store/appStore.js - Für Geschäftslogik rund um Aufgaben

Fokus-Modus anpassen

src/components/focus/FocusMode.jsx - Für UI/UX des Fokus-Modus
src/store/appStore.js - Für Timer-Logik und Statusverwaltung

OBS-Integration konfigurieren

src/components/settings/OBSSettings.jsx - Für Einstellungs-UI
src/services/obsService.js - Für WebSocket-Verbindung mit OBS
src/services/webServerService.js - Für den eingebetteten Webserver
src/obs-templates - Für Anzeigetemplates in OBS

Notizensystem erweitern

src/components/notes/Note.jsx - Für einzelne Notizkomponenten
src/components/notes/NotesList.jsx - Für die Notizenübersicht

Datenmodell ändern

src/store/appStore.js - Zentraler Ort für Datenmanagement und Geschäftslogik

Technologien

Electron: Desktop-Anwendungsrahmen
React: UI-Bibliothek
Tailwind CSS: Styling
Zustand: Zustandsmanagement
React Beautiful DnD: Drag & Drop-Funktionalität
obs-websocket-js: OBS-Integration
Express: Eingebetteter Webserver

Mit diesem Leitfaden können Sie schnell die relevanten Dateien und Module identifizieren, um spezifische Änderungen am MiniPlaner-Projekt vorzunehmen.

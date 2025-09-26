/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { quickstartTranslationRef } from './ref';

const quickstartTranslationDe = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Erste Schritte mit dem Developer Hub',
    'header.subtitle': 'Wir führen Sie durch einige schnelle Schritte',
    'steps.setupAuthentication.title': 'Authentifizierung einrichten',
    'steps.setupAuthentication.description':
      'Richten Sie sichere Anmeldedaten ein, um Ihr Konto vor unbefugtem Zugriff zu schützen.',
    'steps.setupAuthentication.ctaTitle': 'Mehr erfahren',
    'steps.configureRbac.title': 'RBAC konfigurieren',
    'steps.configureRbac.description':
      'Weisen Sie Rollen und Berechtigungen zu, um zu kontrollieren, wer Ressourcen anzeigen, erstellen oder bearbeiten kann.',
    'steps.configureRbac.ctaTitle': 'Zugriff verwalten',
    'steps.configureGit.title': 'Git konfigurieren',
    'steps.configureGit.description':
      'Verbinden Sie Ihre Git-Anbieter wie GitHub, um Code zu verwalten, Workflows zu automatisieren und mit Plattformfunktionen zu integrieren.',
    'steps.configureGit.ctaTitle': 'Mehr erfahren',
    'steps.managePlugins.title': 'Plugins verwalten',
    'steps.managePlugins.description':
      'Durchsuchen und installieren Sie Erweiterungen, um Funktionen hinzuzufügen, externe Tools zu verbinden und Ihre Erfahrung anzupassen.',
    'steps.managePlugins.ctaTitle': 'Plugins erkunden',
    'steps.importApplication.title': 'Anwendung importieren',
    'steps.importApplication.description':
      'Importieren Sie Ihren vorhandenen Code und Ihre Dienste in den Katalog, um sie über Ihr Entwicklerportal zu organisieren und darauf zuzugreifen.',
    'steps.importApplication.ctaTitle': 'Importieren',
    'steps.learnAboutCatalog.title': 'Über den Katalog lernen',
    'steps.learnAboutCatalog.description':
      'Entdecken Sie alle Softwarekomponenten, Dienste und APIs und sehen Sie deren Eigentümer und Dokumentation.',
    'steps.learnAboutCatalog.ctaTitle': 'Katalog anzeigen',
    'steps.exploreSelfServiceTemplates.title': 'Self-Service-Vorlagen erkunden',
    'steps.exploreSelfServiceTemplates.description':
      'Verwenden Sie unsere Self-Service-Vorlagen, um schnell neue Projekte, Dienste oder Dokumentationen einzurichten.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Vorlagen erkunden',
    'steps.findAllLearningPaths.title': 'Alle Lernpfade finden',
    'steps.findAllLearningPaths.description':
      'Integrieren Sie maßgeschneidertes E-Learning in Ihre Workflows mit Lernpfaden, um das Onboarding zu beschleunigen, Qualifikationslücken zu schließen und bewährte Praktiken zu fördern.',
    'steps.findAllLearningPaths.ctaTitle': 'Lernpfade anzeigen',
    'button.quickstart': 'Schnellstart',
    'button.openQuickstartGuide': 'Schnellstart-Leitfaden öffnen',
    'button.closeDrawer': 'Drawer schließen',
    'button.gotIt': 'Verstanden!',
    'footer.progress': '{{progress}}% Fortschritt',
    'footer.notStarted': 'Nicht begonnen',
    'footer.hide': 'Ausblenden',
    'content.emptyState.title':
      'Schnellstart-Inhalte sind für Ihre Rolle nicht verfügbar.',
    'item.expandAriaLabel': '{{title}} Details erweitern',
    'item.collapseAriaLabel': '{{title}} Details einklappen',
    'item.expandButtonAriaLabel': 'Element erweitern',
    'item.collapseButtonAriaLabel': 'Element einklappen',
    'dev.pageTitle': 'Quickstart Plugin Testseite',
    'dev.pageDescription':
      'Dies ist eine Testseite für das Quickstart-Plugin. Verwenden Sie die Schaltflächen unten, um mit dem Quickstart-Drawer zu interagieren.',
    'dev.drawerControls': 'Drawer-Steuerungen',
    'dev.currentState': 'Aktueller Drawer-Status: {{state}}',
    'dev.stateOpen': 'Offen',
    'dev.stateClosed': 'Geschlossen',
    'dev.instructions': 'Anweisungen',
    'dev.step1':
      '1. Klicken Sie auf "Schnellstart-Leitfaden öffnen", um den Drawer zu öffnen',
    'dev.step2': '2. Navigieren Sie durch die Schnellstart-Schritte',
    'dev.step3':
      '3. Testen Sie die Fortschrittsverfolgung durch Abschließen von Schritten',
    'dev.step4':
      '4. Der Drawer kann mit der Schließen-Schaltfläche oder den eigenen Steuerelementen des Drawers geschlossen werden',
    'dev.step5':
      '5. Der Fortschritt wird automatisch in localStorage gespeichert',
  },
});

export default quickstartTranslationDe;

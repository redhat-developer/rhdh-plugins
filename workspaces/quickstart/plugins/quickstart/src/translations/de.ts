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

/**
 * de translation for plugin.quickstart.
 * @public
 */
const quickstartTranslationDe = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Legen Sie los mit dem Developer Hub',
    'header.subtitle': 'Wir führen Sie durch einige kurze Schritte',
    'steps.setupAuthentication.title': 'Authentifizierung einrichten',
    'steps.setupAuthentication.description':
      'Richten Sie sichere Anmeldedaten ein, um Ihr Konto vor unbefugtem Zugriff zu schützen.',
    'steps.setupAuthentication.ctaTitle': 'Mehr erfahren',
    'steps.configureRbac.title': 'RBAC konfigurieren',
    'steps.configureRbac.description':
      'Weisen Sie Rollen und Berechtigungen zu, um zu steuern, wer Ressourcen anzeigen, erstellen oder bearbeiten darf, und sorgen Sie so für eine sichere und effiziente Zusammenarbeit.',
    'steps.configureRbac.ctaTitle': 'Zugriff verwalten',
    'steps.configureGit.title': 'Git konfigurieren',
    'steps.configureGit.description':
      'Verbinden Sie Ihre Git-Provider wie z. B. GitHub, um Code zu verwalten, Workflows zu automatisieren und Plattformfunktionen zu integrieren.',
    'steps.configureGit.ctaTitle': 'Mehr erfahren',
    'steps.managePlugins.title': 'Plugins verwalten',
    'steps.managePlugins.description':
      'Durchsuchen und installieren Sie Erweiterungen, um Funktionen hinzuzufügen, Verbindungen zu externen Tools herzustellen und Ihr Benutzererlebnis individuell anzupassen.',
    'steps.managePlugins.ctaTitle': 'Plugins entdecken',
    'steps.importApplication.title': 'Anwendung importieren',
    'steps.importApplication.description':
      'Importieren Sie bestehenden Code und Dienste in den Katalog, um sie zu organisieren und über Ihr Entwicklerportal darauf zuzugreifen.',
    'steps.importApplication.ctaTitle': 'Importieren',
    'steps.learnAboutCatalog.title': 'Informationen zum Katalog',
    'steps.learnAboutCatalog.description':
      'Entdecken Sie alle Softwarekomponenten, Dienste und APIs, und sehen Sie sich deren Eigentümer und Dokumentation an.',
    'steps.learnAboutCatalog.ctaTitle': 'Katalog anzeigen',
    'steps.exploreSelfServiceTemplates.title':
      'Self-Service-Templates erkunden',
    'steps.exploreSelfServiceTemplates.description':
      'Nutzen Sie unsere Self-Service-Templates, um schnell neue Projekte, Dienste oder Dokumentationen einzurichten.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Templates erkunden',
    'steps.findAllLearningPaths.title': 'Alle Lernpfade suchen',
    'steps.findAllLearningPaths.description':
      'Integrieren Sie maßgeschneiderte E-Learning-Angebote mit Lernpfaden in Ihre Workflows, um das Onboarding zu beschleunigen, Kompetenzlücken zu schließen und bewährte Verfahren zu fördern.',
    'steps.findAllLearningPaths.ctaTitle': 'Lernpfade anzeigen',
    'steps.setupLightspeed.title': 'Lightspeed einrichten',
    'steps.setupLightspeed.description':
      'Verbinden Sie Lightspeed mit einem unterstützten großen Sprachmodell (LLM) und konfigurieren Sie Berechtigungen, um Ihren Entwicklern KI-gestützte Assistenz zu bieten.',
    'steps.setupLightspeed.ctaTitle': 'Mehr erfahren',
    'steps.getStartedWithLightspeed.title': 'Erste Schritte mit Lightspeed',
    'steps.getStartedWithLightspeed.description':
      'Beheben Sie Probleme, generieren Sie Code, und erfahren Sie mithilfe des KI-Chats mehr über Plattformressourcen.',
    'steps.getStartedWithLightspeed.ctaTitle': 'Mehr erfahren',
    'button.quickstart': 'Schnellstart',
    'button.openQuickstartGuide': 'Schnellstartanleitung öffnen',
    'button.closeDrawer': 'Drawer schließen',
    'button.gotIt': 'Verstanden!',
    'snackbar.helpPrompt':
      'Brauchen Sie Hilfe? Öffnen Sie die Schnellstartanleitung, indem Sie auf das (?) Symbol in der Kopfzeile klicken!',
    'footer.progress': '{{progress}} % Fortschritt',
    'footer.notStarted': 'Nicht gestartet',
    'footer.hide': 'Ausblenden',
    'content.emptyState.title':
      'Schnellstartinhalte sind für Ihre Rolle nicht verfügbar.',
    'item.expandAriaLabel': 'Details zu {{title}} erweitern',
    'item.collapseAriaLabel': 'Details zu {{title}} komprimieren',
    'item.expandButtonAriaLabel': 'Element erweitern',
    'item.collapseButtonAriaLabel': 'Element komprimieren',
    'dev.pageTitle': 'Testseite für Schnellstart-Plugin',
    'dev.pageDescription':
      'Dies ist eine Testseite für das Schnellstart-Plugin. Verwenden Sie die Schaltflächen unten, um mit dem Schnellstart-Drawer zu interagieren.',
    'dev.drawerControls': 'Drawer-Steuerelemente',
    'dev.currentState': 'Aktueller Drawer-Status: {{state}}',
    'dev.stateOpen': 'Offen',
    'dev.stateClosed': 'Geschlossen',
    'dev.instructions': 'Anweisungen',
    'dev.step1':
      "1. Klicken Sie auf 'Schnellstartanleitung öffnen', um den Drawer zu öffnen.",
    'dev.step2':
      '2. Navigieren Sie durch die Schritte der Schnellstartanleitung.',
    'dev.step3':
      '3. Testen Sie die Fortschrittsverfolgung, indem Sie Schritte abschließen.',
    'dev.step4':
      "4. Der Drawer kann entweder über die Schaltfläche 'Schließen' oder über die Steuerelemente des Drawers selbst geschlossen werden.",
    'dev.step5':
      '5. Der Fortschritt wird automatisch im localStorage gespeichert.',
  },
});

export default quickstartTranslationDe;

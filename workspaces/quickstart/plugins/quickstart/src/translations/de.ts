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
    'header.title': "Los geht's mit dem Developer Hub!",
    'header.subtitle': 'Wir führen Sie durch einige kurze Schritte.',
    'steps.setupAuthentication.title': 'Authentifizierung einrichten',
    'steps.setupAuthentication.description':
      'Richten Sie sichere Anmeldedaten ein, um Ihr Konto vor unbefugtem Zugriff zu schützen.',
    'steps.setupAuthentication.ctaTitle': 'Weitere Informationen',
    'steps.configureRbac.title': 'RBAC konfigurieren',
    'steps.configureRbac.description':
      'Weisen Sie Rollen und Berechtigungen zu, um zu steuern, wer Ressourcen anzeigen, erstellen oder bearbeiten kann, und gewährleisten Sie so eine sichere und effiziente Zusammenarbeit.',
    'steps.configureGit.title': 'Git konfigurieren',
    'steps.configureGit.description':
      'Verbinden Sie Ihre Git-Anbieter, wie z. B. GitHub, um Code zu verwalten, Arbeitsabläufe zu automatisieren und Plattformfunktionen zu integrieren.',
    'steps.managePlugins.title': 'Plugins verwalten',
    'steps.managePlugins.description':
      'Durchsuchen und installieren Sie Erweiterungen, um Funktionen hinzuzufügen, Verbindungen zu externen Tools herzustellen und Ihr Benutzererlebnis individuell anzupassen.',
    'steps.importApplication.title': 'Importanwendung',
    'steps.importApplication.description':
      'Importieren Sie Ihren bestehenden Code und Ihre Services in den Katalog, um sie zu organisieren und über Ihr Entwicklerportal darauf zuzugreifen.',
    'steps.importApplication.ctaTitle': 'Importieren',
    'steps.learnAboutCatalog.title': 'Erfahren Sie mehr über den Katalog',
    'steps.learnAboutCatalog.description':
      'Entdecken Sie alle Softwarekomponenten, Dienste und APIs und sehen Sie sich deren Eigentümer und Dokumentation an.',
    'steps.exploreSelfServiceTemplates.title': 'Self-Service-Vorlagen erkunden',
    'steps.exploreSelfServiceTemplates.description':
      'Nutzen Sie unsere Self-Service-Vorlagen, um schnell neue Projekte, Services oder Dokumentationen einzurichten.',
    'steps.findAllLearningPaths.title': 'Alle Lernpfade anzeigen',
    'steps.findAllLearningPaths.description':
      'Integrieren Sie maßgeschneiderte E-Learning-Angebote mit Lernpfaden in Ihre Arbeitsabläufe, um das Onboarding zu beschleunigen, Kompetenzlücken zu schließen und bewährte Verfahren zu fördern.',
    'steps.setupLightspeed.title': 'Lightspeed einrichten',
    'steps.setupLightspeed.description':
      'Verbinden Sie Lightspeed mit einem unterstützten großen Sprachmodell (LLM) und konfigurieren Sie Berechtigungen, um Ihren Entwicklern Ihre KI-gestützte Unterstützung bereitzustellen.',
    'steps.setupLightspeed.ctaTitle': 'Weitere Informationen',
    'steps.getStartedWithLightspeed.title': 'Legen Sie los mit Lightspeed',
    'steps.getStartedWithLightspeed.description':
      'Beheben Sie Probleme, generieren Sie Code und lernen Sie die Ressourcen der Plattform mithilfe eines KI-gestützten Chats kennen.',
    'button.quickstart': 'Schnellstart',
    'button.openQuickstartGuide': 'Schnellstartanleitung öffnen',
    'button.closeDrawer': 'Schublade schließen',
    'button.gotIt': 'Habe es!',
    'snackbar.helpPrompt':
      'Brauchen Sie Hilfe? Klicken Sie auf dieses (?)-Symbol in der Kopfzeile, um zur Schnellstartanleitung zu gelangen!',
    'footer.progress': '{{progress}}% Fortschritt',
    'footer.notStarted': 'Nicht gestartet',
    'footer.hide': 'Verstecken',
    'content.emptyState.title':
      'Schnellstartinhalte sind für Ihre Rolle nicht verfügbar.',
    'item.expandAriaLabel': 'Details zu {{title}} erweitern',
    'item.collapseAriaLabel': 'Details zum Ausblenden von {{title}}',
    'item.expandButtonAriaLabel': 'Element erweitern',
    'item.collapseButtonAriaLabel': 'Element ausblenden',
    'dev.pageTitle': 'Schnellstart-Plugin-Testseite',
    'dev.pageDescription':
      'Dies ist eine Testseite für das Quickstart-Plugin. Verwenden Sie die Schaltflächen unten, um mit der Schnellstartleiste zu interagieren.',
    'dev.drawerControls': 'Schubladensteuerung',
    'dev.currentState': 'Aktueller Schubladenstatus: {{state}}',
    'dev.stateClosed': 'Geschlossen',
    'dev.instructions': 'Anweisungen',
    'dev.step1':
      '1. Klicken Sie auf „Schnellstartanleitung öffnen“, um die Schublade zu öffnen.',
    'dev.step2': '2. Folgen Sie den Schnellstartschritten',
    'dev.step3':
      '3. Testen Sie die Fortschrittsverfolgung, indem Sie die folgenden Schritte ausführen',
    'dev.step4':
      '4. Die Schublade kann entweder über die Schließtaste oder über die Bedienelemente der Schublade selbst geschlossen werden.',
    'dev.step5':
      '5. Der Fortschritt wird automatisch im localStorage gespeichert.',
  },
});

export default quickstartTranslationDe;

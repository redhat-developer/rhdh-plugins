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
    'button.closeDrawer': 'Schublade schließen',
    'button.gotIt': 'Habe es!',
    'button.openQuickstartGuide': 'Schnellstartanleitung öffnen',
    'button.quickstart': 'Schnellstart',
    'content.emptyState.title':
      'Schnellstartinhalte sind für Ihre Rolle nicht verfügbar.',
    'dev.currentState': 'Aktueller Schubladenstatus: {{state}}',
    'dev.drawerControls': 'Schubladensteuerung',
    'dev.instructions': 'Anweisungen',
    'dev.pageDescription':
      'Dies ist eine Testseite für das Quickstart-Plugin. Verwenden Sie die Schaltflächen unten, um mit der Schnellstartleiste zu interagieren.',
    'dev.pageTitle': 'Schnellstart-Plugin-Testseite',
    'dev.stateClosed': 'Geschlossen',
    'dev.stateOpen': 'Öffnen',
    'dev.step1':
      '1. Klicken Sie auf „Schnellstartanleitung öffnen“, um die Schublade zu öffnen.',
    'dev.step2': '2. Folgen Sie den Schnellstartschritten',
    'dev.step3':
      '3. Testen Sie die Fortschrittsverfolgung, indem Sie die folgenden Schritte ausführen',
    'dev.step4':
      '4. Die Schublade kann entweder über die Schließtaste oder über die Bedienelemente der Schublade selbst geschlossen werden.',
    'dev.step5':
      '5. Der Fortschritt wird automatisch im localStorage gespeichert.',
    'footer.hide': 'Verstecken',
    'footer.notStarted': 'Nicht gestartet',
    'footer.progress': '{{progress}}% Fortschritt',
    'header.subtitle': 'Wir führen Sie durch einige kurze Schritte.',
    'header.title': "Los geht's mit dem Developer Hub!",
    'item.collapseAriaLabel': 'Details zum Ausblenden von {{title}}',
    'item.collapseButtonAriaLabel': 'Element ausblenden',
    'item.expandAriaLabel': 'Details zu {{title}} erweitern',
    'item.expandButtonAriaLabel': 'Element erweitern',
    'snackbar.helpPrompt':
      'Brauchen Sie Hilfe? Klicken Sie auf dieses (?)-Symbol in der Kopfzeile, um zur Schnellstartanleitung zu gelangen!',
    'steps.configureGit.ctaTitle': 'Weitere Informationen',
    'steps.configureGit.description':
      'Verbinden Sie Ihre Git-Anbieter, wie z. B. GitHub, um Code zu verwalten, Arbeitsabläufe zu automatisieren und Plattformfunktionen zu integrieren.',
    'steps.configureGit.title': 'Git konfigurieren',
    'steps.configureRbac.ctaTitle': 'Zugriff verwalten',
    'steps.configureRbac.description':
      'Weisen Sie Rollen und Berechtigungen zu, um zu steuern, wer Ressourcen anzeigen, erstellen oder bearbeiten kann, und gewährleisten Sie so eine sichere und effiziente Zusammenarbeit.',
    'steps.configureRbac.title': 'RBAC konfigurieren',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Vorlagen entdecken',
    'steps.exploreSelfServiceTemplates.description':
      'Nutzen Sie unsere Self-Service-Vorlagen, um schnell neue Projekte, Services oder Dokumentationen einzurichten.',
    'steps.exploreSelfServiceTemplates.title': 'Self-Service-Vorlagen erkunden',
    'steps.findAllLearningPaths.ctaTitle': 'Lernpfade ansehen',
    'steps.findAllLearningPaths.description':
      'Integrieren Sie maßgeschneiderte E-Learning-Angebote mit Lernpfaden in Ihre Arbeitsabläufe, um das Onboarding zu beschleunigen, Kompetenzlücken zu schließen und bewährte Verfahren zu fördern.',
    'steps.findAllLearningPaths.title': 'Alle Lernpfade anzeigen',
    'steps.getStartedWithLightspeed.ctaTitle': 'Weitere Informationen',
    'steps.getStartedWithLightspeed.description':
      'Beheben Sie Probleme, generieren Sie Code und lernen Sie die Ressourcen der Plattform mithilfe eines KI-gestützten Chats kennen.',
    'steps.getStartedWithLightspeed.title': 'Legen Sie los mit Lightspeed',
    'steps.importApplication.ctaTitle': 'Importieren',
    'steps.importApplication.description':
      'Importieren Sie Ihren bestehenden Code und Ihre Services in den Katalog, um sie zu organisieren und über Ihr Entwicklerportal darauf zuzugreifen.',
    'steps.importApplication.title': 'Importanwendung',
    'steps.learnAboutCatalog.ctaTitle': 'Katalog ansehen',
    'steps.learnAboutCatalog.description':
      'Entdecken Sie alle Softwarekomponenten, Dienste und APIs und sehen Sie sich deren Eigentümer und Dokumentation an.',
    'steps.learnAboutCatalog.title': 'Erfahren Sie mehr über den Katalog',
    'steps.managePlugins.ctaTitle': 'Plugins erkunden',
    'steps.managePlugins.description':
      'Durchsuchen und installieren Sie Erweiterungen, um Funktionen hinzuzufügen, Verbindungen zu externen Tools herzustellen und Ihr Benutzererlebnis individuell anzupassen.',
    'steps.managePlugins.title': 'Plugins verwalten',
    'steps.setupAuthentication.ctaTitle': 'Weitere Informationen',
    'steps.setupAuthentication.description':
      'Richten Sie sichere Anmeldedaten ein, um Ihr Konto vor unbefugtem Zugriff zu schützen.',
    'steps.setupAuthentication.title': 'Authentifizierung einrichten',
    'steps.setupLightspeed.ctaTitle': 'Weitere Informationen',
    'steps.setupLightspeed.description':
      'Verbinden Sie Lightspeed mit einem unterstützten großen Sprachmodell (LLM) und konfigurieren Sie Berechtigungen, um Ihren Entwicklern Ihre KI-gestützte Unterstützung bereitzustellen.',
    'steps.setupLightspeed.title': 'Lightspeed einrichten',
  },
});

export default quickstartTranslationDe;

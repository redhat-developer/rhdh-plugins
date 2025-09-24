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
import { homepageTranslationRef } from './ref';

/**
 * German translation for Homepage.
 * @public
 */
const homepageTranslationDe = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'Willkommen zurück!',
    'header.welcomePersonalized': 'Willkommen zurück, {{name}}!',
    'header.local': 'Lokal',
    'homePage.empty':
      'Keine Homepage-Karten (Einbindungspunkte) konfiguriert oder gefunden.',
    'search.placeholder': 'Suchen',
    'quickAccess.title': 'Schnellzugriff',
    'quickAccess.fetchError': 'Daten konnten nicht abgerufen werden.',
    'quickAccess.error': 'Unbekannter Fehler',
    'featuredDocs.learnMore': ' Mehr erfahren',
    'templates.title': 'Vorlagen erkunden',
    'templates.fetchError': 'Daten konnten nicht abgerufen werden.',
    'templates.error': 'Unbekannter Fehler',
    'templates.empty': 'Noch keine Vorlagen hinzugefügt',
    'templates.emptyDescription':
      'Sobald Vorlagen hinzugefügt werden, wird dieser Bereich relevante Inhalte anzeigen, die auf Ihre Erfahrung zugeschnitten sind.',
    'templates.register': 'Vorlage registrieren',
    'templates.viewAll': 'Alle {{count}} Vorlagen anzeigen',
    'onboarding.greeting.goodMorning': 'Guten Morgen',
    'onboarding.greeting.goodAfternoon': 'Guten Tag',
    'onboarding.greeting.goodEvening': 'Guten Abend',
    'onboarding.guest': 'Gast',
    'onboarding.getStarted.title': 'Erste Schritte',
    'onboarding.getStarted.description':
      'Lernen Sie Red Hat Developer Hub kennen.',
    'onboarding.getStarted.buttonText': 'Dokumentation lesen',
    'onboarding.getStarted.ariaLabel':
      'Dokumentation lesen (öffnet in neuem Tab)',
    'onboarding.explore.title': 'Erkunden',
    'onboarding.explore.description':
      'Erkunden Sie Komponenten, APIs und Vorlagen.',
    'onboarding.explore.buttonText': 'Zum Katalog gehen',
    'onboarding.explore.ariaLabel': 'Zum Katalog gehen',
    'onboarding.learn.title': 'Lernen',
    'onboarding.learn.description':
      'Erkunden und entwickeln Sie neue Fähigkeiten.',
    'onboarding.learn.buttonText': 'Zu Lernpfaden gehen',
    'onboarding.learn.ariaLabel': 'Zu Lernpfaden gehen',
    'entities.title': 'Erkunden Sie Ihren Software-Katalog',
    'entities.fetchError': 'Daten konnten nicht abgerufen werden.',
    'entities.error': 'Unbekannter Fehler',
    'entities.description':
      'Durchsuchen Sie die Systeme, Komponenten, Ressourcen und APIs, die in Ihrer Organisation verfügbar sind.',
    'entities.close': 'schließen',
    'entities.empty': 'Noch kein Software-Katalog hinzugefügt',
    'entities.emptyDescription':
      'Sobald Software-Kataloge hinzugefügt werden, wird dieser Bereich relevante Inhalte anzeigen, die auf Ihre Erfahrung zugeschnitten sind.',
    'entities.register': 'Komponente registrieren',
    'entities.viewAll': 'Alle {{count}} Katalog-Entitäten anzeigen',
  },
});

export default homepageTranslationDe;

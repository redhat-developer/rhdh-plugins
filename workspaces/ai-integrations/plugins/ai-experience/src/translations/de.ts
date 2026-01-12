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
import { aiExperienceTranslationRef } from './ref';

const aiExperienceTranslationDe = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'page.title': 'KI-Erlebnis',
    'page.subtitle':
      'Entdecken Sie KI-Modelle, Server, Nachrichten und Lernressourcen',

    'learn.getStarted.title': 'Erste Schritte',
    'learn.getStarted.description':
      'Erfahren Sie mehr über Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Zu Tech Docs',

    'learn.explore.title': 'Erkunden',
    'learn.explore.description':
      'Erkunden Sie KI-Modelle, Server und Vorlagen.',
    'learn.explore.cta': 'Zum Katalog',

    'learn.learn.title': 'Lernen',
    'learn.learn.description':
      'Entdecken und entwickeln Sie neue Fähigkeiten in der KI.',
    'learn.learn.cta': 'Zu den Lernpfaden',

    'news.pageTitle': 'KI-Nachrichten',
    'news.fetchingRssFeed': 'RSS-Feed wird abgerufen',
    'news.noContentAvailable': 'Keine Inhalte verfügbar',
    'news.noContentDescription':
      'Es scheint, als könnten wir keine Inhalte von diesem RSS-Feed abrufen. Sie können die URL überprüfen oder zu einer anderen Quelle wechseln, indem Sie die Plugin-Konfigurationsdatei aktualisieren.',
    'news.noRssContent': 'Kein RSS-Inhalt',

    'modal.title.preview': 'Anhangsvorschau',
    'modal.title.edit': 'Anhang bearbeiten',
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.close': 'Schließen',
    'modal.cancel': 'Abbrechen',

    'common.viewMore': 'Mehr anzeigen',
    'common.guest': 'Gast',
    'common.template': 'Vorlage',
    'common.latest': 'neueste',
    'common.more': 'mehr',

    'greeting.goodMorning': 'Guten Morgen',
    'greeting.goodAfternoon': 'Guten Tag',
    'greeting.goodEvening': 'Guten Abend',

    'sections.exploreAiModels': 'KI-Modelle erkunden',
    'sections.exploreAiTemplates': 'KI-Vorlagen erkunden',
    'sections.discoverModels':
      'Entdecken Sie die KI-Modelle und -Dienste, die in Ihrer Organisation verfügbar sind',
    'sections.viewAllModels': 'Alle {{count}} Modelle anzeigen',
    'sections.viewAllTemplates': 'Alle {{count}} Vorlagen anzeigen',

    'accessibility.close': 'schließen',
    'accessibility.aiIllustration': 'KI-Illustration',
    'accessibility.aiModelsIllustration': 'KI-Modelle-Illustration',
  },
});

export default aiExperienceTranslationDe;

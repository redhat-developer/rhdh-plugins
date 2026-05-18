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

/**
 * de translation for plugin.ai-experience.
 * @public
 */
const aiExperienceTranslationDe = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'accessibility.aiIllustration': 'KI-Illustration',
    'accessibility.aiModelsIllustration': 'Illustration von KI-Modellen',
    'accessibility.close': 'Schließen',
    'common.guest': 'Gast',
    'common.latest': 'letzte',
    'common.more': 'mehr',
    'common.template': 'Vorlage',
    'common.viewMore': 'Mehr anzeigen',
    'greeting.goodAfternoon': 'Guten Tag',
    'greeting.goodEvening': 'Guten Abend',
    'greeting.goodMorning': 'Guten Morgen',
    'learn.explore.cta': 'Zum Katalog',
    'learn.explore.description':
      'Entdecken Sie KI-Modelle, -Server und -Vorlagen.',
    'learn.explore.title': 'Entdecken',
    'learn.getStarted.cta': 'Zu Tech Docs',
    'learn.getStarted.description':
      'Erfahren Sie mehr über Red Hat Developer Hub.',
    'learn.getStarted.title': "Los geht's!",
    'learn.learn.cta': 'Zu den Lernpfaden',
    'learn.learn.description':
      'Entdecken und entwickeln Sie neue Fähigkeiten im Bereich KI.',
    'learn.learn.title': 'Lernen',
    'modal.cancel': 'Abbrechen',
    'modal.close': 'Schließen',
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.title.edit': 'Anhang bearbeiten',
    'modal.title.preview': 'Vorschau des Anhangs anzeigen',
    'news.fetchingRssFeed': 'RSS-Feed wird abgerufen',
    'news.noContentAvailable': 'Kein Inhalt verfügbar',
    'news.noContentDescription':
      'Anscheinend konnten wir keine Inhalte von diesem RSS-Feed abrufen. Sie können die URL überprüfen oder zu einer anderen Quelle wechseln, indem Sie die Plugin-Konfigurationsdatei aktualisieren.',
    'news.noRssContent': 'Kein RSS-Inhalt',
    'news.pageTitle': 'Neuigkeiten zu KI',
    'page.subtitle':
      'Entdecken Sie KI-Modelle, KI-Server sowie Neuigkeiten und Lernressourcen zu KI',
    'page.title': 'KI-Erfahrung',
    'sections.discoverModels':
      'Entdecken Sie die in Ihrer Organisation verfügbaren KI-Modelle und -Dienste.',
    'sections.exploreAiModels': 'KI-Modelle erkunden',
    'sections.exploreAiTemplates': 'KI-Vorlagen entdecken',
    'sections.viewAllModels': 'Alle {{count}} Modelle anzeigen',
    'sections.viewAllTemplates': 'Alle {{count}} Vorlagen anzeigen',
  },
});

export default aiExperienceTranslationDe;

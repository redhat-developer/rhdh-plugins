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
    'page.title': 'KI-Erfahrung',
    'page.subtitle': 'Entdecken Sie KI-Modelle, KI-Server sowie Neuigkeiten und Lernressourcen zu KI',
    'learn.getStarted.title': 'Los geht\'s!',
    'learn.getStarted.description': 'Erfahren Sie mehr über Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Zu Tech Docs',
    'learn.explore.title': 'Entdecken',
    'learn.explore.description': 'Entdecken Sie KI-Modelle, -Server und -Vorlagen.',
    'learn.learn.title': 'Lernen',
    'learn.learn.description': 'Entdecken und entwickeln Sie neue Fähigkeiten im Bereich KI.',
    'learn.learn.cta': 'Zu den Lernpfaden',
    'news.pageTitle': 'Neuigkeiten zu KI',
    'news.fetchingRssFeed': 'RSS-Feed wird abgerufen',
    'news.noContentAvailable': 'Kein Inhalt verfügbar',
    'news.noContentDescription': 'Anscheinend konnten wir keine Inhalte von diesem RSS-Feed abrufen. Sie können die URL überprüfen oder zu einer anderen Quelle wechseln, indem Sie die Plugin-Konfigurationsdatei aktualisieren.',
    'news.noRssContent': 'Kein RSS-Inhalt',
    'modal.title.preview': 'Vorschau des Anhangs anzeigen',
    'modal.title.edit': 'Anhang bearbeiten',
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.close': 'Schließen',
    'modal.cancel': 'Abbrechen',
    'common.viewMore': 'Mehr anzeigen',
    'common.guest': 'Gast',
    'common.template': 'Vorlage',
    'common.latest': 'letzte',
    'common.more': 'mehr',
    'greeting.goodMorning': 'Guten Morgen',
    'greeting.goodAfternoon': 'Guten Tag',
    'greeting.goodEvening': 'Guten Abend',
    'sections.exploreAiModels': 'KI-Modelle erkunden',
    'sections.exploreAiTemplates': 'KI-Vorlagen entdecken',
    'sections.discoverModels': 'Entdecken Sie die in Ihrer Organisation verfügbaren KI-Modelle und -Dienste.',
    'sections.viewAllModels': 'Alle {{count}} Modelle anzeigen',
    'sections.viewAllTemplates': 'Alle {{count}} Vorlagen anzeigen',
    'accessibility.close': 'Schließen',
    'accessibility.aiIllustration': 'KI-Illustration',
    'accessibility.aiModelsIllustration': 'Illustration von KI-Modellen',
  },
});

export default aiExperienceTranslationDe;

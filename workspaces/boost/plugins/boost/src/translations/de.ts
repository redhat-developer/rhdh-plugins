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
import { boostTranslationRef } from './ref';

/**
 * de translation for plugin.boost.
 * @public
 */
const boostTranslationDe = createTranslationMessages({
  ref: boostTranslationRef,
  messages: {
    'catalog.page.title': 'KI-Katalog',
    'catalog.toolbar.allPrefix': 'Alle',
    'catalog.toolbar.search': 'Suche',
    'catalog.toolbar.viewGrid': 'Kartenansicht',
    'catalog.toolbar.viewTable': 'Tabellenansicht',
    'catalog.toolbar.filters': 'Filter',
    'catalog.filter.title': 'Filter',
    'catalog.filter.all': 'Alle',
    'catalog.filter.type': 'Typ',
    'catalog.filter.provider': 'Anbieter',
    'catalog.filter.owner': 'Eigentümer',
    'catalog.filter.tag': 'Tag',
    'catalog.filter.clearAll': 'Alle löschen',
    'catalog.card.assetDetailsTitle': 'KI-Asset-Details',
    'catalog.card.descriptionLabel': 'Beschreibung',
    'catalog.card.viewDetails': 'Details zu {{title}} anzeigen',
    'catalog.card.tagsLabel': 'Tags',
    'catalog.card.providerLabel': 'Anbieter',
    'catalog.card.usageTitle': 'Nutzung',
    'catalog.card.versionLabel': 'Version',
    'catalog.card.usageDownloadZip': 'ZIP herunterladen',
    'catalog.card.usageViewSource': 'Quelle anzeigen',
    'catalog.card.serverTypeLabel': 'Servertyp',
    'catalog.card.apiKeyLabel': 'API-Schlüssel erforderlich',
    'catalog.card.defaultModelLabel': 'Standardmodell',
    'catalog.card.rationaleLabel': 'Begründung',
    'catalog.card.disciplinesLabel': 'Disziplinen',
    'catalog.card.categoriesLabel': 'Kategorien',
    'catalog.card.relatedAgentsLabel': 'Verwandte Agenten',
    'catalog.card.ruleCategoryLabel': 'Regelkategorie',
    'catalog.card.toolsLabel': 'Werkzeuge',
    'catalog.card.remotesLabel': 'Remote-Endpunkte',
    'catalog.card.definitionLabel': 'Definition',
    'catalog.card.modelsTitle': 'Modelle',
    'catalog.card.modelTitle': 'Modell',
    'catalog.card.viewModels': 'Alle Modelle anzeigen',
    'catalog.card.modelsDialogTitle': 'Verfügbare Modelle',
    'catalog.card.modelSearch': 'Modelle suchen',
    'catalog.card.noModelsMatch':
      'Keine Modelle stimmen mit Ihrer Suche überein.',
    'catalog.card.instructionsTitle': 'Agentenanweisungen',
    'catalog.card.handoffDescriptionTitle': 'Übergabebeschreibung',
    'catalog.card.handoffTargetsTitle': 'Übergabeziele',
    'catalog.card.ragEnabledLabel': 'RAG aktiviert',
    'catalog.card.yes': 'Ja',
    'catalog.card.no': 'Nein',
    'catalog.table.name': 'Name',
    'catalog.table.type': 'Typ',
    'catalog.table.owner': 'Eigentümer',
    'catalog.table.provider': 'Anbieter',
    'catalog.table.description': 'Beschreibung',
    'catalog.empty.title': 'Keine KI-Assets verfügbar',
    'catalog.empty.description':
      'KI-Assets erscheinen hier, nachdem sie veröffentlicht oder aus Ihrem Katalog synchronisiert wurden. Beim ersten Laden kann dies einen Moment dauern.',
    'catalog.empty.refresh': 'Aktualisieren',
    'catalog.empty.learnMore': 'Veröffentlichung erlernen',
    'catalog.emptyFiltered.title': 'Keine KI-Assets entsprechen Ihren Filtern',
    'catalog.emptyFiltered.description':
      'Versuchen Sie, Ihre Such- oder Filterkriterien anzupassen, um zu finden, wonach Sie suchen.',
    'catalog.emptyFiltered.clearFilters': 'Filter löschen',
    'catalog.error.title': 'KI-Assets konnten nicht geladen werden',
    'catalog.error.description':
      'Beim Verbinden mit dem Katalog ist ein Problem aufgetreten. Überprüfen Sie Ihre Netzwerkverbindung und versuchen Sie es erneut.',
    'catalog.error.retry': 'Erneut versuchen',
    'nav.aiCatalog': 'KI-Katalog',
  },
});

export default boostTranslationDe;

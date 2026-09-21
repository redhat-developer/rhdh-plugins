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
 * it translation for plugin.boost.
 * @public
 */
const boostTranslationIt = createTranslationMessages({
  ref: boostTranslationRef,
  messages: {
    'catalog.page.title': 'Catalogo IA',
    'catalog.toolbar.allPrefix': 'Tutti',
    'catalog.toolbar.search': 'Cerca',
    'catalog.toolbar.viewGrid': 'Vista a schede',
    'catalog.toolbar.viewTable': 'Vista a tabella',
    'catalog.toolbar.filters': 'Filtri',
    'catalog.filter.title': 'Filtri',
    'catalog.filter.all': 'Tutti',
    'catalog.filter.type': 'Tipo',
    'catalog.filter.provider': 'Fornitore',
    'catalog.filter.owner': 'Proprietario',
    'catalog.filter.tag': 'Tag',
    'catalog.filter.clearAll': 'Cancella tutto',
    'catalog.card.assetDetailsTitle': 'Dettagli risorsa IA',
    'catalog.card.descriptionLabel': 'Descrizione',
    'catalog.card.viewDetails': 'Visualizza dettagli di {{title}}',
    'catalog.card.tagsLabel': 'Tag',
    'catalog.card.providerLabel': 'Fornitore',
    'catalog.card.usageTitle': 'Utilizzo',
    'catalog.card.versionLabel': 'Versione',
    'catalog.card.usageDownloadZip': 'Scarica ZIP',
    'catalog.card.usageViewSource': 'Visualizza sorgente',
    'catalog.card.serverTypeLabel': 'Tipo di server',
    'catalog.card.apiKeyLabel': 'Chiave API richiesta',
    'catalog.card.defaultModelLabel': 'Modello predefinito',
    'catalog.card.rationaleLabel': 'Motivazione',
    'catalog.card.disciplinesLabel': 'Discipline',
    'catalog.card.categoriesLabel': 'Categorie',
    'catalog.card.relatedAgentsLabel': 'Agenti correlati',
    'catalog.card.ruleCategoryLabel': 'Categoria di regola',
    'catalog.card.toolsLabel': 'Strumenti',
    'catalog.card.remotesLabel': 'Endpoint remoti',
    'catalog.card.definitionLabel': 'Definizione',
    'catalog.card.modelsTitle': 'Modelli',
    'catalog.card.modelTitle': 'Modello',
    'catalog.card.viewModels': 'Visualizza tutti i modelli',
    'catalog.card.modelsDialogTitle': 'Modelli disponibili',
    'catalog.card.modelSearch': 'Cerca modelli',
    'catalog.card.noModelsMatch':
      'Nessun modello corrisponde alla tua ricerca.',
    'catalog.card.instructionsTitle': "Istruzioni dell'agente",
    'catalog.card.handoffDescriptionTitle': 'Descrizione del trasferimento',
    'catalog.card.handoffTargetsTitle': 'Destinazioni del trasferimento',
    'catalog.card.ragEnabledLabel': 'RAG abilitato',
    'catalog.card.yes': 'Sì',
    'catalog.card.no': 'No',
    'catalog.table.name': 'Nome',
    'catalog.table.type': 'Tipo',
    'catalog.table.owner': 'Proprietario',
    'catalog.table.provider': 'Fornitore',
    'catalog.table.description': 'Descrizione',
    'catalog.empty.title': 'Nessuna risorsa IA disponibile',
    'catalog.empty.description':
      'Le risorse IA appariranno qui dopo essere state pubblicate o sincronizzate dal catalogo. Al primo caricamento, potrebbe richiedere un momento.',
    'catalog.empty.refresh': 'Aggiorna',
    'catalog.empty.learnMore': 'Come pubblicare',
    'catalog.emptyFiltered.title':
      'Nessuna risorsa IA corrisponde ai tuoi filtri',
    'catalog.emptyFiltered.description':
      'Prova a modificare i criteri di ricerca o di filtro per trovare ciò che stai cercando.',
    'catalog.emptyFiltered.clearFilters': 'Cancella filtri',
    'catalog.error.title': 'Impossibile caricare le risorse IA',
    'catalog.error.description':
      'Si è verificato un problema durante la connessione al catalogo. Controlla la connessione di rete e riprova.',
    'catalog.error.retry': 'Riprova',
    'nav.aiCatalog': 'Catalogo IA',
  },
});

export default boostTranslationIt;

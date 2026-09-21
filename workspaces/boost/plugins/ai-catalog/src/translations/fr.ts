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
import { aiCatalogTranslationRef } from './ref';

/**
 * fr translation for plugin.ai-catalog.
 * @public
 */
const aiCatalogTranslationFr = createTranslationMessages({
  ref: aiCatalogTranslationRef,
  messages: {
    'catalog.page.title': 'Catalogue IA',
    'catalog.toolbar.allPrefix': 'Tous',
    'catalog.toolbar.search': 'Rechercher',
    'catalog.toolbar.viewGrid': 'Vue en cartes',
    'catalog.toolbar.viewTable': 'Vue en tableau',
    'catalog.toolbar.filters': 'Filtres',
    'catalog.filter.title': 'Filtres',
    'catalog.filter.all': 'Tous',
    'catalog.filter.type': 'Type',
    'catalog.filter.provider': 'Fournisseur',
    'catalog.filter.owner': 'Propriétaire',
    'catalog.filter.tag': 'Étiquette',
    'catalog.filter.clearAll': 'Tout effacer',
    'catalog.card.assetDetailsTitle': 'Détails de la ressource IA',
    'catalog.card.descriptionLabel': 'Description',
    'catalog.card.viewDetails': 'Voir les détails de {{title}}',
    'catalog.card.tagsLabel': 'Étiquettes',
    'catalog.card.providerLabel': 'Fournisseur',
    'catalog.card.usageTitle': 'Utilisation',
    'catalog.card.versionLabel': 'Version',
    'catalog.card.usageDownloadZip': 'Télécharger le ZIP',
    'catalog.card.usageViewSource': 'Voir la source',
    'catalog.card.serverTypeLabel': 'Type de serveur',
    'catalog.card.apiKeyLabel': 'Clé API requise',
    'catalog.card.defaultModelLabel': 'Modèle par défaut',
    'catalog.card.rationaleLabel': 'Justification',
    'catalog.card.disciplinesLabel': 'Disciplines',
    'catalog.card.categoriesLabel': 'Catégories',
    'catalog.card.relatedAgentsLabel': 'Agents associés',
    'catalog.card.ruleCategoryLabel': 'Catégorie de règle',
    'catalog.card.toolsLabel': 'Outils',
    'catalog.card.remotesLabel': "Points d'accès distants",
    'catalog.card.definitionLabel': 'Définition',
    'catalog.card.modelsTitle': 'Modèles',
    'catalog.card.modelTitle': 'Modèle',
    'catalog.card.viewModels': 'Voir tous les modèles',
    'catalog.card.modelsDialogTitle': 'Modèles disponibles',
    'catalog.card.modelSearch': 'Rechercher des modèles',
    'catalog.card.noModelsMatch':
      'Aucun modèle ne correspond à votre recherche.',
    'catalog.card.instructionsTitle': "Instructions de l'agent",
    'catalog.card.handoffDescriptionTitle': 'Description du transfert',
    'catalog.card.handoffTargetsTitle': 'Cibles du transfert',
    'catalog.card.ragEnabledLabel': 'RAG activé',
    'catalog.card.yes': 'Oui',
    'catalog.card.no': 'Non',
    'catalog.table.name': 'Nom',
    'catalog.table.type': 'Type',
    'catalog.table.owner': 'Propriétaire',
    'catalog.table.provider': 'Fournisseur',
    'catalog.table.description': 'Description',
    'catalog.empty.title': 'Aucune ressource IA disponible',
    'catalog.empty.description':
      'Les ressources IA apparaissent ici après avoir été publiées ou synchronisées depuis votre catalogue. Lors du premier chargement, cela peut prendre un moment.',
    'catalog.empty.refresh': 'Actualiser',
    'catalog.empty.learnMore': 'Comment publier',
    'catalog.emptyFiltered.title':
      'Aucune ressource IA ne correspond à vos filtres',
    'catalog.emptyFiltered.description':
      "Essayez d'ajuster vos critères de recherche ou de filtre pour trouver ce que vous cherchez.",
    'catalog.emptyFiltered.clearFilters': 'Effacer les filtres',
    'catalog.error.title': 'Échec du chargement des ressources IA',
    'catalog.error.description':
      'Un problème est survenu lors de la connexion au catalogue. Vérifiez votre connexion réseau et réessayez.',
    'catalog.error.retry': 'Réessayer',
    'nav.aiCatalog': 'Catalogue IA',
  },
});

export default aiCatalogTranslationFr;

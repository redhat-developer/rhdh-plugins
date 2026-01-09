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
import { globalHeaderTranslationRef } from './ref';

/**
 * fr translation for plugin.global-header.
 * @public
 */
const globalHeaderTranslationFr = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Aide',
    'help.noSupportLinks': 'Aucun lien de support',
    'help.noSupportLinksSubtitle':
      'Votre administrateur doit configurer des liens d’assistance.',
    'help.quickStart': 'Démarrage rapide',
    'help.supportTitle': 'Assistance',
    'profile.picture': 'Photo de profil',
    'profile.settings': 'Paramètres',
    'profile.myProfile': 'Mon profil',
    'profile.signOut': 'Déconnection',
    'search.placeholder': 'Recherche...',
    'search.noResults': 'Aucun résultat trouvé',
    'search.errorFetching': 'Erreur lors de la récupération des résultats',
    'applicationLauncher.tooltip': "Lanceur d'applications",
    'applicationLauncher.noLinksTitle': "Aucun lien d'application configuré",
    'applicationLauncher.noLinksSubtitle':
      "Configurez les liens d'application dans la configuration du plugin dynamique pour un accès rapide à partir d'ici.",
    'applicationLauncher.developerHub': 'Centre des développeurs',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentation',
    'applicationLauncher.sections.developerTools': 'Outils de développement',
    'starred.title': 'Vos articles favoris',
    'starred.removeTooltip': 'Supprimer de la liste',
    'starred.noItemsTitle': 'Aucun élément étoilé pour le moment',
    'starred.noItemsSubtitle':
      "Cliquez sur l'icône étoile à côté du nom d'une entité pour l'enregistrer ici pour un accès rapide.",
    'notifications.title': 'Notifications',
    'notifications.unsupportedDismissOption':
      'Option de rejet non prise en charge « {{option}} », actuellement prise en charge « none », « session » ou « localstorage » !',
    'create.title': 'Self-service',
    'create.registerComponent.title': 'Enregistrer un composant',
    'create.registerComponent.subtitle': 'Importez-le sur la page du catalogue',
    'create.templates.sectionTitle': 'Utiliser un modèle',
    'create.templates.allTemplates': 'Tous les modèles',
    'create.templates.errorFetching':
      'Erreur lors de la récupération des modèles',
    'create.templates.noTemplatesAvailable': 'Aucun modèle disponible',
  },
});

export default globalHeaderTranslationFr;

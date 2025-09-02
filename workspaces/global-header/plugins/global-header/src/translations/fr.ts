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

const globalHeaderTranslationFr = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Aide',
    'help.noSupportLinks': 'Aucun lien de support',
    'help.noSupportLinksSubtitle':
      'Votre administrateur doit configurer les liens de support.',
    'help.quickStart': 'Démarrage rapide',
    'help.supportTitle': 'Support',
    'profile.picture': 'Photo de profil',
    'profile.signOut': 'Se déconnecter',
    'search.placeholder': 'Rechercher...',
    'search.noResults': 'Aucun résultat trouvé',
    'search.errorFetching': 'Erreur lors de la récupération des résultats',
    'applicationLauncher.tooltip': "Lanceur d'applications",
    'applicationLauncher.noLinksTitle': "Aucun lien d'application configuré",
    'applicationLauncher.noLinksSubtitle':
      "Configurez les liens d'application dans la configuration du plugin dynamique pour un accès rapide depuis ici.",
    'starred.title': 'Vos éléments favoris',
    'starred.removeTooltip': 'Supprimer de la liste',
    'starred.noItemsTitle': 'Aucun élément favori pour le moment',
    'starred.noItemsSubtitle':
      "Cliquez sur l'icône étoile à côté du nom d'une entité pour l'enregistrer ici pour un accès rapide.",
    'notifications.title': 'Notifications',
    'notifications.unsupportedDismissOption':
      'Option de rejet non supportée "{{option}}", actuellement supporté "none", "session" ou "localstorage" !',
    'create.title': 'Libre-service',
    'create.registerComponent.title': 'Enregistrer un composant',
    'create.registerComponent.subtitle': "L'importer dans la page de catalogue",
    'create.templates.sectionTitle': 'Utiliser un modèle',
    'create.templates.allTemplates': 'Tous les modèles',
    'create.templates.errorFetching':
      'Erreur lors de la récupération des modèles',
    'create.templates.noTemplatesAvailable': 'Aucun modèle disponible',
    'profile.settings': 'Paramètres',
    'profile.myProfile': 'Mon profil',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentation',
    'applicationLauncher.sections.developerTools': 'Outils de développement',
  },
});

export default globalHeaderTranslationFr;

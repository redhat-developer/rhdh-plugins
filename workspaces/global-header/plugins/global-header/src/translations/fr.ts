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
    'help.noSupportLinks': 'Aucun lien d\'assistance',
    'help.noSupportLinksSubtitle': 'Votre administrateur doit configurer les liens d\'assistance.',
    'help.quickStart': 'Démarrage rapide',
    'help.supportTitle': 'Assistance',
    'profile.picture': 'Photo de profil',
    'profile.settings': 'Paramètres',
    'profile.myProfile': 'Mon profil',
    'profile.signOut': 'se déconnecter',
    'search.placeholder': 'Recherche...',
    'search.noResults': 'Aucun résultat trouvé',
    'search.errorFetching': 'Erreur lors de la récupération des résultats',
    'search.allResults': 'Tous les résultats',
    'search.clear': 'Effacer',
    'applicationLauncher.tooltip': 'Lanceur d’applications',
    'applicationLauncher.noLinksTitle': 'Aucun lien d\'application configuré',
    'applicationLauncher.noLinksSubtitle': 'Configurez les liens de l\'application dans la configuration dynamique du plugin pour un accès rapide depuis ici.',
    'applicationLauncher.developerHub': 'Espace développeurs',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentation',
    'applicationLauncher.sections.developerTools': 'Outils de développement',
    'starred.title': 'Vos articles favoris',
    'starred.removeTooltip': 'Supprimer de la liste',
    'starred.noItemsTitle': 'Aucun article marqué d\'une étoile pour le moment',
    'starred.noItemsSubtitle': 'Cliquez sur l\'icône en forme d\'étoile à côté du nom d\'une entité pour l\'enregistrer ici et y accéder rapidement.',
    'notifications.title': 'Notifications',
    'notifications.unsupportedDismissOption': 'Option de fermeture non prise en charge « {{option}} », actuellement prise en charge « none », « session » ou « localstorage » !',
  },
});

export default globalHeaderTranslationFr;

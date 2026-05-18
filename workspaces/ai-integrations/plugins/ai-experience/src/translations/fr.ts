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
 * fr translation for plugin.ai-experience.
 * @public
 */
const aiExperienceTranslationFr = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'accessibility.aiIllustration': 'Illustration IA',
    'accessibility.aiModelsIllustration': "Illustration de modèles d'IA",
    'accessibility.close': 'fermer',
    'common.guest': 'Invité',
    'common.latest': 'dernier',
    'common.more': 'davantage',
    'common.template': 'Modèle',
    'common.viewMore': 'Afficher plus',
    'greeting.goodAfternoon': 'Bon après-midi',
    'greeting.goodEvening': 'Bonne soirée',
    'greeting.goodMorning': 'Bonjour',
    'learn.explore.cta': 'Accéder au catalogue',
    'learn.explore.description':
      "Explorez les modèles, serveurs et modèles d'IA.",
    'learn.explore.title': 'Explorer',
    'learn.getStarted.cta': 'Accédez à la documentation technique',
    'learn.getStarted.description': 'Découvrez Red Hat Developer Hub.',
    'learn.getStarted.title': 'Commencer',
    'learn.learn.cta': "Accéder aux parcours d'apprentissage",
    'learn.learn.description':
      'Explorez et développez de nouvelles compétences en IA.',
    'learn.learn.title': 'Apprendre',
    'modal.cancel': 'Annuler',
    'modal.close': 'Fermer',
    'modal.edit': 'Modifier',
    'modal.save': 'Enregistrer',
    'modal.title.edit': 'Modifier la pièce jointe',
    'modal.title.preview': 'Aperçu de la pièce jointe',
    'news.fetchingRssFeed': 'Récupération du flux RSS',
    'news.noContentAvailable': 'Aucun contenu disponible',
    'news.noContentDescription':
      "Il semblerait que nous n'ayons pas pu récupérer le contenu de ce flux RSS. Vous pouvez revérifier l'URL ou passer à une autre source en mettant à jour le fichier de configuration du plugin.",
    'news.noRssContent': 'Aucun contenu RSS',
    'news.pageTitle': 'Actualités IA',
    'page.subtitle':
      "Explorez les modèles d'IA, les serveurs, les actualités et les ressources d'apprentissage",
    'page.title': 'Expérience IA',
    'sections.discoverModels':
      "Découvrez les modèles et services d'IA disponibles dans votre organisation",
    'sections.exploreAiModels': "Explorez les modèles d'IA",
    'sections.exploreAiTemplates': "Explorez les modèles d'IA",
    'sections.viewAllModels': 'Afficher tous les modèles {{count}}',
    'sections.viewAllTemplates': 'Afficher tous les modèles {{count}}',
  },
});

export default aiExperienceTranslationFr;

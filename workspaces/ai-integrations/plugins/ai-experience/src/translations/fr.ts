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
    'page.title': 'Expérience IA',
    'page.subtitle':
      "Explorez les modèles d'IA, les serveurs, les actualités et les ressources d'apprentissage",
    'learn.getStarted.title': 'Commencer',
    'learn.getStarted.description': 'Découvrez Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Accédez à la documentation technique',
    'learn.explore.title': 'Explorer',
    'learn.explore.description':
      "Explorez les modèles, serveurs et modèles d'IA.",
    'learn.learn.title': 'Apprendre',
    'learn.learn.description':
      'Explorez et développez de nouvelles compétences en IA.',
    'learn.learn.cta': "Accéder aux parcours d'apprentissage",
    'news.pageTitle': 'Actualités IA',
    'news.fetchingRssFeed': 'Récupération du flux RSS',
    'news.noContentAvailable': 'Aucun contenu disponible',
    'news.noContentDescription':
      "Il semblerait que nous n'ayons pas pu récupérer le contenu de ce flux RSS. Vous pouvez revérifier l'URL ou passer à une autre source en mettant à jour le fichier de configuration du plugin.",
    'news.noRssContent': 'Aucun contenu RSS',
    'modal.title.preview': 'Aperçu de la pièce jointe',
    'modal.title.edit': 'Modifier la pièce jointe',
    'modal.edit': 'Modifier',
    'modal.save': 'Enregistrer',
    'modal.close': 'Fermer',
    'modal.cancel': 'Annuler',
    'common.viewMore': 'Afficher plus',
    'common.guest': 'Invité',
    'common.template': 'Modèle',
    'common.latest': 'dernier',
    'common.more': 'davantage',
    'greeting.goodMorning': 'Bonjour',
    'greeting.goodAfternoon': 'Bon après-midi',
    'greeting.goodEvening': 'Bonne soirée',
    'sections.exploreAiModels': "Explorez les modèles d'IA",
    'sections.exploreAiTemplates': "Explorez les modèles d'IA",
    'sections.discoverModels':
      "Découvrez les modèles et services d'IA disponibles dans votre organisation",
    'sections.viewAllModels': 'Afficher tous les modèles {{count}}',
    'sections.viewAllTemplates': 'Afficher tous les modèles {{count}}',
    'accessibility.close': 'fermer',
    'accessibility.aiIllustration': 'Illustration IA',
    'accessibility.aiModelsIllustration': "Illustration de modèles d'IA",
  },
});

export default aiExperienceTranslationFr;

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

const aiExperienceTranslationFr = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'page.title': 'Expérience IA',
    'page.subtitle':
      "Explorez des modèles d'IA, des serveurs, des actualités et des ressources d'apprentissage",

    'learn.getStarted.title': 'Commencer',
    'learn.getStarted.description': 'En savoir plus sur Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Aller à Tech Docs',

    'learn.explore.title': 'Explorer',
    'learn.explore.description':
      "Explorez les modèles d'IA, les serveurs et les modèles.",
    'learn.explore.cta': 'Aller au Catalogue',

    'learn.learn.title': 'Apprendre',
    'learn.learn.description':
      'Explorez et développez de nouvelles compétences en IA.',
    'learn.learn.cta': "Aller aux Parcours d'apprentissage",

    'news.pageTitle': 'Actualités IA',
    'news.fetchingRssFeed': 'Récupération du flux RSS',
    'news.noContentAvailable': 'Aucun contenu disponible',
    'news.noContentDescription':
      "Il semble que nous n'ayons pas pu récupérer le contenu de ce flux RSS. Vous pouvez vérifier l'URL ou passer à une source différente en mettant à jour le fichier de configuration du plugin.",
    'news.noRssContent': 'Aucun contenu RSS',

    'modal.title.preview': 'Aperçu de la pièce jointe',
    'modal.title.edit': 'Modifier la pièce jointe',
    'modal.edit': 'Modifier',
    'modal.save': 'Enregistrer',
    'modal.close': 'Fermer',
    'modal.cancel': 'Annuler',

    'common.viewMore': 'Voir plus',
    'common.guest': 'Invité',
    'common.template': 'Modèle',
    'common.latest': 'dernière',
    'common.more': 'plus',

    'greeting.goodMorning': 'Bonjour',
    'greeting.goodAfternoon': 'Bon après-midi',
    'greeting.goodEvening': 'Bonsoir',

    'sections.exploreAiModels': "Explorer les modèles d'IA",
    'sections.exploreAiTemplates': "Explorer les modèles d'IA",
    'sections.discoverModels':
      "Découvrez les modèles et services d'IA disponibles dans votre organisation",
    'sections.viewAllModels': 'Voir tous les {{count}} modèles',
    'sections.viewAllTemplates': 'Voir tous les {{count}} modèles',

    'accessibility.close': 'fermer',
    'accessibility.aiIllustration': "Illustration d'IA",
    'accessibility.aiModelsIllustration': "Illustration des modèles d'IA",
  },
});

export default aiExperienceTranslationFr;

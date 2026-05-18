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
 * es translation for plugin.ai-experience.
 * @public
 */
const aiExperienceTranslationEs = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'accessibility.aiIllustration': 'Ilustración de IA',
    'accessibility.aiModelsIllustration': 'Ilustración de modelos de IA',
    'accessibility.close': 'cerrar',
    'common.guest': 'Invitado',
    'common.latest': 'último',
    'common.more': 'más',
    'common.template': 'Plantilla',
    'common.viewMore': 'Ver más',
    'greeting.goodAfternoon': 'Buenas tardes',
    'greeting.goodEvening': 'Buenas noches',
    'greeting.goodMorning': 'Buen día',
    'learn.explore.cta': 'Ir al catálogo',
    'learn.explore.description':
      'Explore modelos, servidores y plantillas con tecnología de IA.',
    'learn.explore.title': 'Explorar',
    'learn.getStarted.cta': 'Ir a Documentos técnicos',
    'learn.getStarted.description':
      'Obtenga información sobre Red Hat Developer Hub.',
    'learn.getStarted.title': 'Empezar',
    'learn.learn.cta': 'Ir a Rutas de aprendizaje',
    'learn.learn.description': 'Explore y desarrolle nuevas habilidades de IA.',
    'learn.learn.title': 'Aprender',
    'modal.cancel': 'Cancelar',
    'modal.close': 'Cerrar',
    'modal.edit': 'Modificar',
    'modal.save': 'Guardar',
    'modal.title.edit': 'Modificar archivo adjunto',
    'modal.title.preview': 'Previsualizar archivo adjunto',
    'news.fetchingRssFeed': 'Extrayendo documentos RSS',
    'news.noContentAvailable': 'No hay contenido disponible',
    'news.noContentDescription':
      'Parece que no pudimos obtener contenido de ese documento RSS. Puede verificar la URL o cambiar a una fuente diferente; para ello, actualice el archivo de configuración del complemento.',
    'news.noRssContent': 'No hay contenido RSS',
    'news.pageTitle': 'Novedades de IA',
    'page.subtitle':
      'Explore modelos, servidores, novedades y recursos de aprendizaje con tecnología de IA',
    'page.title': 'Experiencia de IA',
    'sections.discoverModels':
      'Descubra los modelos y servicios de IA que están disponibles en su organización',
    'sections.exploreAiModels': 'Explorar modelos de IA',
    'sections.exploreAiTemplates': 'Explorar plantillas de IA',
    'sections.viewAllModels': 'Ver todos los {{count}} modelos',
    'sections.viewAllTemplates': 'Ver todas las {{count}} plantillas',
  },
});

export default aiExperienceTranslationEs;

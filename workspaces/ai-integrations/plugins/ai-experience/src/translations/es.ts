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

const aiExperienceTranslationEs = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'page.title': 'Experiencia de IA',
    'page.subtitle':
      'Explora modelos de IA, servidores, noticias y recursos de aprendizaje',

    'learn.getStarted.title': 'Comenzar',
    'learn.getStarted.description': 'Aprende sobre Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Ir a Tech Docs',

    'learn.explore.title': 'Explorar',
    'learn.explore.description':
      'Explora modelos de IA, servidores y plantillas.',
    'learn.explore.cta': 'Ir al Catálogo',

    'learn.learn.title': 'Aprender',
    'learn.learn.description': 'Explora y desarrolla nuevas habilidades en IA.',
    'learn.learn.cta': 'Ir a Rutas de Aprendizaje',

    'news.pageTitle': 'Noticias de IA',
    'news.fetchingRssFeed': 'Obteniendo feed RSS',
    'news.noContentAvailable': 'No hay contenido disponible',
    'news.noContentDescription':
      'Parece que no pudimos obtener contenido de ese feed RSS. Puedes verificar la URL o cambiar a una fuente diferente actualizando el archivo de configuración del plugin.',
    'news.noRssContent': 'Sin contenido RSS',

    'modal.title.preview': 'Vista previa del adjunto',
    'modal.title.edit': 'Editar adjunto',
    'modal.edit': 'Editar',
    'modal.save': 'Guardar',
    'modal.close': 'Cerrar',
    'modal.cancel': 'Cancelar',

    'common.viewMore': 'Ver más',
    'common.guest': 'Invitado',
    'common.template': 'Plantilla',
    'common.latest': 'última',
    'common.more': 'más',

    'greeting.goodMorning': 'Buenos días',
    'greeting.goodAfternoon': 'Buenas tardes',
    'greeting.goodEvening': 'Buenas noches',

    'sections.exploreAiModels': 'Explorar modelos de IA',
    'sections.exploreAiTemplates': 'Explorar plantillas de IA',
    'sections.discoverModels':
      'Descubre los modelos y servicios de IA disponibles en tu organización',
    'sections.viewAllModels': 'Ver todos los {{count}} modelos',
    'sections.viewAllTemplates': 'Ver todas las {{count}} plantillas',

    'accessibility.close': 'cerrar',
    'accessibility.aiIllustration': 'Ilustración de IA',
    'accessibility.aiModelsIllustration': 'Ilustración de modelos de IA',
  },
});

export default aiExperienceTranslationEs;

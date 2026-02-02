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
import { x2aPluginTranslationRef } from './ref';

/**
 * Italian translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationIt = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Hub di conversione',
    'page.title': 'Hub di conversione',
    'page.subtitle':
      'Avvia e monitora le conversioni asincrone di file Chef in playbook Ansible pronti per la produzione.',
    'page.devTitle': 'Hub di conversione',
    'newProjectPage.title': 'Nuova conversione',
    'newProjectPage.subtitle':
      'Hub di conversione / Nuovo progetto di conversione',
    'newProjectPage.steps.jobNameAndDescription':
      'Nome e descrizione del lavoro',
    'newProjectPage.steps.sourceAndTargetRepos':
      'Repository di origine e di destinazione',
    'newProjectPage.steps.reviewAndStart': 'Rivedi e avvia',
    'newProjectPage.steps.lastStep': 'Ultimo passo',
    'table.columns.name': 'Nome',
    'table.columns.abbreviation': 'Abbreviazione',
    'table.columns.status': 'Stato',
    'table.columns.description': 'Descrizione',
    'table.columns.createdAt': 'Creato il',
    'table.actions.deleteProject': 'Elimina progetto',
    'table.detailPanel': 'TODO: Dettagli del progetto {{name}}',
    'table.projectsCount': 'Progetti ({{count}})',
    'common.newProject': 'Nuovo progetto',
    'wizard.cancel': 'Annulla',
    'wizard.back': 'Indietro',
    'wizard.next': 'Avanti',
  },
});

export default x2aPluginTranslationIt;

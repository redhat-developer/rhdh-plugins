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
    'table.columns.name': 'Nome',
    'table.columns.abbreviation': 'Abbreviazione',
    'table.columns.status': 'Stato',
    'table.columns.description': 'Descrizione',
    'table.columns.sourceRepo': 'Repository sorgente',
    'table.columns.targetRepo': 'Repository di destinazione',
    'table.columns.createdAt': 'Creato il',
    'table.actions.deleteProject': 'Elimina progetto',
    'table.detailPanel': 'TODO: Dettagli del progetto {{name}}',
    'table.projectsCount': 'Progetti ({{count}})',
    'project.description': 'Descrizione',
    'project.id': 'ID',
    'project.abbreviation': 'Abbreviazione',
    'project.createdBy': 'Creato da',
    'common.newProject': 'Nuovo progetto',
    'wizard.cancel': 'Annulla',
    'wizard.back': 'Indietro',
    'wizard.next': 'Avanti',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analizzare',
    'module.phases.migrate': 'Migrare',
    'module.phases.publish': 'Pubblicare',
    'module.actions.runNextPhase': 'Esegui fase successiva',
    'module.lastPhase': 'Ultima fase',
    'module.name': 'Nome',
    'module.status': 'Stato',
    'module.sourcePath': 'Percorso sorgente',
    'module.artifacts': 'Artefatti',
    'artifact.types.migration_plan': 'Piano di migrazione',
    'artifact.types.module_migration_plan': 'Piano del modulo',
    'artifact.types.migrated_sources': 'Sorgenti migrate',
    'userPromptDialog.title': 'Esegui fase successiva',
    'userPromptDialog.promptLabel': 'Prompt utente',
    'userPromptDialog.promptPlaceholder':
      'Aggiungi eventualmente istruzioni o contesto per questa esecuzione. Lascialo vuoto per il comportamento predefinito.',
    'userPromptDialog.run': 'Esegui',
    'userPromptDialog.moduleName':
      'Fornisci requisiti aggiuntivi prima di avviare la fase successiva per il modulo {{moduleName}}.',
  },
});

export default x2aPluginTranslationIt;

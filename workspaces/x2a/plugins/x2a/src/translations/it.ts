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
    'project.statuses.none': '-',
    'project.statuses.created': 'Creato',
    'project.statuses.initializing': 'In inizializzazione',
    'project.statuses.initialized': 'Inizializzato',
    'project.statuses.inProgress': 'In corso',
    'project.statuses.completed': 'Completato',
    'project.statuses.failed': 'Fallito',
    'common.newProject': 'Nuovo progetto',
    'wizard.cancel': 'Annulla',
    'wizard.back': 'Indietro',
    'wizard.next': 'Avanti',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analizzare',
    'module.phases.migrate': 'Migrare',
    'module.phases.publish': 'Pubblicare',
    'module.summary.total': 'Totale',
    'module.summary.finished': 'Completato',
    'module.summary.waiting': 'In attesa',
    'module.summary.pending': 'In attesa',
    'module.summary.running': 'In esecuzione',
    'module.summary.error': 'Errore',
    'module.actions.runNextPhase': 'Esegui fase successiva',
    'module.lastPhase': 'Ultima fase',
    'module.name': 'Nome',
    'module.status': 'Stato',
    'module.sourcePath': 'Percorso sorgente',
    'module.artifacts': 'Artefatti',
    'module.startedAt': 'Avviato il',
    'module.finishedAt': 'Terminato il',
    'artifact.types.migration_plan': 'Piano di migrazione',
    'artifact.types.module_migration_plan': 'Piano del modulo',
    'module.statuses.none': '-',
    'module.statuses.pending': 'In attesa',
    'module.statuses.running': 'In esecuzione',
    'module.statuses.success': 'Successo',
    'module.statuses.error': 'Errore',
    'artifact.types.migrated_sources': 'Sorgenti migrate',
  },
});

export default x2aPluginTranslationIt;

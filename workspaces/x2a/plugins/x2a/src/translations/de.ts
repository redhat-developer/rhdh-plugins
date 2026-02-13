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
 * German translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationDe = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Konversions Hub',
    'page.title': 'Konversions Hub',
    'page.subtitle':
      'Starten und verfolgen Sie die asynchrone Umwandlung von Chef-Dateien in produktionsreife Ansible Playbooks.',
    'page.devTitle': 'Konversions Hub',
    'table.columns.name': 'Name',
    'table.columns.abbreviation': 'Abkürzung',
    'table.columns.status': 'Status',
    'table.columns.description': 'Beschreibung',
    'table.columns.sourceRepo': 'Quell-Repository',
    'table.columns.targetRepo': 'Ziel-Repository',
    'table.columns.createdAt': 'Erstellt am',
    'table.actions.deleteProject': 'Projekt löschen',
    'table.detailPanel': 'TODO: Details des Projekts {{name}}',
    'table.projectsCount': 'Projekte ({{count}})',
    'project.description': 'Beschreibung',
    'project.id': 'ID',
    'project.abbreviation': 'Abkürzung',
    'project.createdBy': 'Erstellt von',
    'project.statuses.none': '-',
    'project.statuses.created': 'Erstellt',
    'project.statuses.initializing': 'Wird initialisiert',
    'project.statuses.initialized': 'Initialisiert',
    'project.statuses.inProgress': 'In Bearbeitung',
    'project.statuses.completed': 'Abgeschlossen',
    'project.statuses.failed': 'Fehlgeschlagen',
    'common.newProject': 'Neues Projekt',
    'wizard.cancel': 'Abbrechen',
    'wizard.back': 'Zurück',
    'wizard.next': 'Weiter',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analysieren',
    'module.phases.migrate': 'Migrieren',
    'module.phases.publish': 'Veröffentlichen',
    'module.summary.total': 'Gesamt',
    'module.summary.finished': 'Abgeschlossen',
    'module.summary.waiting': 'Wartend',
    'module.summary.pending': 'Ausstehend',
    'module.summary.running': 'Läuft',
    'module.summary.error': 'Fehler',
    'module.actions.runNextPhase': 'Nächste Phase ausführen',
    'module.lastPhase': 'Letzte Phase',
    'module.name': 'Name',
    'module.status': 'Status',
    'module.sourcePath': 'Quellpfad',
    'module.artifacts': 'Artefakte',
    'module.startedAt': 'Gestartet am',
    'module.finishedAt': 'Beendet am',
    'artifact.types.migration_plan': 'Migrationsplan',
    'artifact.types.module_migration_plan': 'Modulplan',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Ausstehend',
    'module.statuses.running': 'Läuft',
    'module.statuses.success': 'Erfolg',
    'module.statuses.error': 'Fehler',
    'artifact.types.migrated_sources': 'Migrierte Quellen',
  },
});

export default x2aPluginTranslationDe;

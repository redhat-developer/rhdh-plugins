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
import { scorecardTranslationRef } from './ref';

/**
 * de translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationDe = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': 'Noch keine Scorecards hinzugefügt',
    'emptyState.description':
      'Scorecards helfen Ihnen, den Zustand der Komponenten auf einen Blick zu überwachen. Schauen Sie sich zunächst unsere Dokumentation mit den Einrichtungshinweisen an.',
    'emptyState.altText': 'Keine Scorecards',
    'permissionRequired.title': 'Fehlende Berechtigung',
    'permissionRequired.description':
      'Wenn Sie das Scorecard-Plugin anzeigen möchten, wenden Sie sich an den Administrator, um die Berechtigung {{permission}} zu erhalten.',
    'permissionRequired.altText': 'Berechtigung erforderlich',
    'errors.entityMissingProperties':
      'Für die Scorecard-Suche fehlen dem Element die erforderlichen Eigenschaften.',
    'errors.invalidApiResponse': 'Ungültiges Antwortformat der Scorecard-API',
    'errors.fetchError': 'Fehler beim Abrufen der Scorecards: {{error}}',
    'errors.invalidThresholds': 'Ungültige Schwellenwerte',
    'errors.missingPermission': 'Fehlende Berechtigung',
    'errors.missingPermissionMessage':
      'Um die Metriken der Scorecard einzusehen, muss Ihnen der Administrator die erforderliche Berechtigung erteilen.',
    'metric.github.files_check.title': 'GitHub-Dateiprüfung: {{name}}',
    'metric.github.files_check.description':
      'Prüft, ob die Datei {{name}} im Repository vorhanden ist.',
    'thresholds.exist': 'Vorhanden',
    'thresholds.missing': 'Fehlend',
  },
});

export default scorecardTranslationDe;

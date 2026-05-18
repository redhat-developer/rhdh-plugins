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
    'emptyState.title': 'Noch keine Scorecards hinzugefügt.',
    'emptyState.description':
      'Scorecards helfen Ihnen, den Zustand der Komponenten auf einen Blick zu überwachen. Schauen Sie sich zunächst unsere Dokumentation mit den Einrichtungshinweisen an.',
    'emptyState.altText': 'Keine Scorecards',
    'notFound.title': '404 Die Seite konnte nicht gefunden werden.',
    'notFound.description':
      'Versuchen Sie, eine {{indexFile}}-Datei im Stammverzeichnis des docs-Verzeichnisses dieses Repositorys hinzuzufügen.',
    'notFound.goBack': 'Zurück',
    'notFound.contactSupport': 'Kontaktieren Sie den Support.',
    'notFound.altText': 'Seite nicht gefunden',
    'permissionRequired.title': 'Fehlende Berechtigung',
    'permissionRequired.description':
      'Um das Scorecard-Plugin anzuzeigen, wenden Sie sich an Ihren Administrator, um die Berechtigung {{permission}} zu erteilen.',
    'permissionRequired.altText': 'Berechtigung erforderlich',
    'common.loading': 'Ladevorgang',
    'errors.entityMissingProperties':
      'Für die Scorecard-Suche fehlen der Entität die erforderlichen Eigenschaften.',
    'errors.missingAggregationId':
      'Die Scorecard ist falsch konfiguriert, die Eigenschaft für die Aggregations-ID (oder Metrik-ID) fehlt.',
    'errors.invalidApiResponse': 'Ungültiges Antwortformat der Scorecard-API',
    'errors.fetchError': 'Fehler beim Abrufen der Scorecards: {{error}}',
    'errors.invalidThresholds': 'Ungültige Schwellenwerte',
    'errors.missingPermission': 'Fehlende Berechtigung',
    'errors.noDataFound': 'Keine Daten gefunden',
    'errors.authenticationError': 'Authentifizierungsfehler',
    'errors.missingPermissionMessage':
      'Um die Kennzahlen der Scorecard einzusehen, muss Ihnen Ihr Administrator die erforderliche Berechtigung erteilen.',
    'thresholds.success': 'Erfolg',
    'thresholds.warning': 'Warnung',
    'thresholds.error': 'Fehler',
    'thresholds.exist': 'Existieren',
    'thresholds.missing': 'Fehlen',
    'thresholds.noEntities': 'Keine Entitäten im Zustand {{category}}',
    'thresholds.entities_one': '{{count}} Entität',
    'thresholds.entities_other': '{{count}} Entitäten',
    'entitiesPage.unknownMetric': 'Unbekannte Metrik',
    'entitiesPage.noDataFound':
      'Um Ihre Daten hier anzuzeigen, überprüfen Sie, ob Ihre Entitäten Werte melden, die sich auf diese Kennzahl beziehen.',
  },
});

export default scorecardTranslationDe;

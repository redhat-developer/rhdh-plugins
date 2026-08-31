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

/**
 * Migration readiness assessment for RHDH AI asset catalog entities.
 *
 * Read-only CLI and library that reports current-to-target entity kind
 * mappings, transformation requirements, and confidence levels against
 * upstream Backstage entity kinds.
 *
 * @packageDocumentation
 */

export type {
  CatalogEntity,
  ConfidenceLevel,
  FetchEntitiesOptions,
  MappingRule,
  EntityAssessment,
  MigrationReport,
} from './types';

export { MAPPING_RULES } from './mappings';
export { analyzeEntities } from './analyze';
export { fetchEntities } from './catalogClient';
export { formatJson, formatText } from './formatters';

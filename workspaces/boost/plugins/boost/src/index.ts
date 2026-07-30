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
 * @packageDocumentation
 *
 * The Boost frontend plugin for Red Hat Developer Hub.
 * Provides AI Catalog browse page and entity page extensions for AI assets.
 */

/** @public */
export { boostPlugin as default, boostTranslationsModule } from './plugin';
/** @public */
export { boostTranslationRef, boostTranslations } from './translations';
/** @public */
export {
  AiCatalogFilterBlueprint,
  filterDefinitionDataRef,
} from './blueprints/AiCatalogFilterBlueprint';
/** @public */
export type { FilterDefinition } from './blueprints/AiCatalogFilterBlueprint';

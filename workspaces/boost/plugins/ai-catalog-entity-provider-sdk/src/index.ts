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
 * SDK for AI asset entity providers.
 *
 * Exports annotation constants and version normalization for the
 * AI catalog entity model.
 *
 * @packageDocumentation
 */

export {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
} from './annotations';

export { normalizeAIAssetVersion } from './normalizeAIAssetVersion';

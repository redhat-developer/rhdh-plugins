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
 * Llama Stack entity provider for the Backstage catalog.
 *
 * Emits AI models and agents as catalog entities, independently
 * deployable as an RHDH dynamic plugin.
 *
 * @packageDocumentation
 */

export { catalogModuleLlamaStackEntityProvider as default } from './module';

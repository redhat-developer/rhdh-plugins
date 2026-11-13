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
 * Shared catalog tag validation constants used by both the D3
 * metadata normalizers and the D5 catalog helpers.
 *
 * @packageDocumentation
 */

/**
 * Catalog tag validation pattern.
 *
 * Tags contain lowercase alphanumeric characters, colons, plus signs,
 * and hash characters, separated by single hyphens.
 *
 * @remarks
 * This pattern matches Backstage's default catalog tag validator.
 * Tests compare it and the length limit with `makeValidator().isValidTag`
 * from `@backstage/catalog-model`, a development-only dependency.
 * Runtime consumers do not need a Backstage dependency for validation.
 *
 * @public
 */
export const CATALOG_TAG_PATTERN = /^[a-z0-9:+#]+(-[a-z0-9:+#]+)*$/;

/**
 * Maximum tag length accepted by the Backstage catalog.
 *
 * @public
 */
export const MAX_TAG_LENGTH = 63;

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
 * Tags must consist of lowercase alphanumeric characters plus `:`, `+`,
 * `#`, `.`, `_`, `-`. Must start and end with an alphanumeric character
 * or one of `:`, `+`, `#`.
 *
 * @remarks
 * This pattern intentionally extends the standard Backstage catalog tag
 * validation rule to allow dots (`.`), underscores (`_`), and
 * consecutive hyphens — per D3/D5 design requirements for OCI and npx
 * metadata normalization. If Backstage changes its tag validation
 * pattern in a future release, this constant must be updated to match,
 * and such a change will be a semver-breaking update to downstream
 * consumers.
 *
 * The pattern is not imported from `@backstage/catalog-model` because
 * that package is not a dependency of this library.
 *
 * @public
 */
export const CATALOG_TAG_PATTERN = /^[a-z0-9:+#]([a-z0-9:+#._-]*[a-z0-9:+#])?$/;

/**
 * Maximum tag length accepted by the Backstage catalog.
 *
 * @public
 */
export const MAX_TAG_LENGTH = 63;

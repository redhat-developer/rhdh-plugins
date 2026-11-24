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

import { lazy, Suspense } from 'react';
import { Progress } from '@backstage/core-components';
import {
  RepoUrlPickerFieldSchema,
  repoPickerValidation,
} from '@backstage/plugin-scaffolder';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

import type { RepoUrlCredentialsOptions } from './useRepoUrlCredentials';

// Importing `RepoUrlPickerFieldExtension` pulls in all stock scaffolder field
// extensions, which webpack cannot tree-shake. Loading the implementation on
// first render keeps them out of the plugin's initial bundle.
const X2ARepoUrlPickerImpl = lazy(() => import('./X2ARepoUrlPickerImpl'));

/**
 * `ui:options` accepted by `X2ARepoUrlPicker`.
 *
 * These mirror the stock `RepoUrlPicker` options, except that
 * `requestUserCredentials` is extended with `readOnly`. They are spelled out rather than derived from
 * `RepoUrlPickerUiOptions`, which upstream has deprecated and which carries an
 * RJSF index signature that widens every property.
 *
 * Note that `x2aRepoUrlPickerFieldSchema` is inherited unchanged from
 * upstream and therefore does not describe `readOnly`; that only affects the
 * scaffolder template editor's field playground, the sole consumer of
 * `schema.uiOptions`.
 *
 * @public
 */
export type X2ARepoUrlPickerUiOptions = {
  allowedHosts?: string[];
  allowedOrganizations?: string[];
  allowedOwners?: string[];
  allowedProjects?: string[];
  allowedRepos?: string[];
  requestUserCredentials?: RepoUrlCredentialsOptions;
};

/** Props of the X2ARepoUrlPicker field. */
export type X2ARepoUrlPickerProps = FieldExtensionComponentProps<
  string,
  X2ARepoUrlPickerUiOptions
>;

/**
 * A drop-in replacement for the Backstage `RepoUrlPicker` scaffolder field that
 * works with SCM instances on custom URLs.
 *
 * Two upstream behaviours stand in the way of self-hosted instances, and this
 * field replaces both:
 *
 * 1. **Host list.** The stock picker filters its dropdown by
 *    `ui:options.allowedHosts`, and an absent `allowedHosts` means an EMPTY
 *    list rather than "no restriction" (see `RepoUrlPickerHost`, which calls
 *    `getIntegrationsList({allowedHosts: hosts ?? []})`). Templates therefore
 *    had to hard-code hosts. This field defaults `allowedHosts` to the GitHub
 *    and GitLab hosts under `integrations:` plus `bitbucket.org`; Azure,
 *    Gerrit, Gitea and Bitbucket Server are left out because x2a does not
 *    support them. When credentials are requested, only the host each OAuth
 *    provider is registered against (`x2a.scm.authHosts`) is offered. An
 *    explicit `allowedHosts` in the template still wins.
 *
 * 2. **Credentials.** The stock picker still handles
 *    `requestUserCredentials` (so owner/repo autocomplete works), but runs
 *    inside a scoped `ApiProvider` whose `scmAuthApi` delegates to the app's
 *    `scmAuthApi`. RHDH maps every `integrations:` host to one per-type auth
 *    API, so the token is only requested for the host set in
 *    `x2a.scm.authHosts`; any other host is refused. See
 *    `useRepoUrlCredentials`.
 *
 * @public
 */
export const X2ARepoUrlPicker = (props: X2ARepoUrlPickerProps) => (
  <Suspense fallback={<Progress />}>
    <X2ARepoUrlPickerImpl {...props} />
  </Suspense>
);

/**
 * Validation for the X2ARepoUrlPicker field. Identical to the stock
 * RepoUrlPicker validation.
 *
 * @public
 */
export const x2aRepoUrlPickerValidation = repoPickerValidation;

/**
 * Field schema for the X2ARepoUrlPicker field. Inherited unchanged from the
 * stock RepoUrlPicker; see `X2ARepoUrlPickerUiOptions` for the one
 * x2a-specific addition it does not describe.
 *
 * @public
 */
export const x2aRepoUrlPickerFieldSchema = RepoUrlPickerFieldSchema;

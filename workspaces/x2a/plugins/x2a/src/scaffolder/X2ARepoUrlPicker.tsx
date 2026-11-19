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

import { useMemo } from 'react';
import { ApiProvider } from '@backstage/core-app-api';
import { getComponentData, useApi } from '@backstage/core-plugin-api';
import { scmIntegrationsApiRef } from '@backstage/integration-react';
import {
  StatusError,
  StatusOK,
  StatusPending,
} from '@backstage/core-components';
import {
  RepoUrlPickerFieldExtension,
  RepoUrlPickerFieldSchema,
  repoPickerValidation,
  type RepoUrlPickerUiOptions,
} from '@backstage/plugin-scaffolder';
import type {
  FieldExtensionComponentProps,
  FieldExtensionOptions,
} from '@backstage/plugin-scaffolder-react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import { useScmHostMap } from '../hooks/useScmHostMap';
import { useTranslation } from '../hooks/useTranslation';
import {
  useRepoUrlCredentials,
  type RepoUrlCredentialsOptions,
} from './useRepoUrlCredentials';

/**
 * Key under which `createScaffolderFieldExtension` attaches its options to the
 * returned data-holder component. The upstream constant is not exported, and
 * the stock `RepoUrlPicker` component itself is not exported either, so this is
 * the only way to reuse it. `X2ARepoUrlPicker.test.tsx` asserts the lookup
 * still works, so a Backstage upgrade that changes this fails in CI.
 */
const FIELD_EXTENSION_KEY = 'scaffolder.extensions.field.v1';

/**
 * The stock Backstage `RepoUrlPicker` component, unwrapped from its field
 * extension. Resolved on render rather than at import time, so that merely
 * importing this module has no side effects.
 */
let stockRepoUrlPicker: ReturnType<typeof unwrapStockRepoUrlPicker>;
function unwrapStockRepoUrlPicker() {
  return getComponentData<
    FieldExtensionOptions<string, RepoUrlPickerUiOptions>
  >(<RepoUrlPickerFieldExtension />, FIELD_EXTENSION_KEY)?.component;
}
/** Clears the memoised component; only for tests. @internal */
export function resetStockRepoUrlPickerForTests() {
  stockRepoUrlPicker = undefined;
}
function getStockRepoUrlPicker() {
  stockRepoUrlPicker ??= unwrapStockRepoUrlPicker();
  return stockRepoUrlPicker;
}

/**
 * `ui:options` accepted by `X2ARepoUrlPicker`.
 *
 * These mirror the stock `RepoUrlPicker` options, except that
 * `requestUserCredentials` is extended with `readOnly` and does not support
 * `additionalScopes`. They are spelled out rather than derived from
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

type X2ARepoUrlPickerProps = FieldExtensionComponentProps<
  string,
  X2ARepoUrlPickerUiOptions
>;

/**
 * Default host list: GitHub and GitLab hosts from the frontend config, then
 * Bitbucket Cloud. Bitbucket Cloud's config is stripped from the frontend
 * config, so it comes from the integrations API (which always has
 * `bitbucket.org`). Public hosts that Backstage injects (github.com,
 * gitlab.com) are offered only when configured.
 */
function useDefaultHosts(): string[] {
  const hostMap = useScmHostMap();
  const integrations = useApi(scmIntegrationsApiRef);
  return useMemo(() => {
    const byProvider = (name: string) =>
      Array.from(hostMap.entries())
        .filter(([, provider]) => provider === name)
        .map(([host]) => host);
    const bitbucketCloud = integrations.bitbucketCloud
      .list()
      .map(i => i.config.host);
    return Array.from(
      new Set([
        ...byProvider('github'),
        ...byProvider('gitlab'),
        ...bitbucketCloud,
      ]),
    );
  }, [hostMap, integrations]);
}

/**
 * Extracts the host from the picker's form data.
 *
 * `RepoUrlPicker` serialises its state as `<host>?owner=…&repo=…`, so the host
 * is everything before the query string. Returns `undefined` before the user
 * has picked anything.
 */
function hostFromFormData(formData: string | undefined): string | undefined {
  const host = formData?.split('?')[0];
  return host || undefined;
}

const CredentialsStatusMessage = ({
  credentials,
}: {
  credentials: ReturnType<typeof useRepoUrlCredentials>;
}) => {
  const { t } = useTranslation();
  const { status, error, retry } = credentials;
  const provider = credentials.provider ?? credentials.host;

  if (status === 'idle' || !provider) {
    return null;
  }

  if (status === 'pending') {
    return (
      <Box mt={1}>
        <StatusPending>
          {t('scaffolder.repoUrlPicker.authPending' as any, { provider })}
        </StatusPending>
      </Box>
    );
  }

  if (status === 'authenticated') {
    return (
      <Box mt={1}>
        <StatusOK>
          {t('scaffolder.repoUrlPicker.authOk' as any, { provider })}
        </StatusOK>
      </Box>
    );
  }

  return (
    <Box mt={1}>
      <StatusError>
        {t('scaffolder.repoUrlPicker.authError' as any, {
          provider,
          error: error ?? '',
        })}
      </StatusError>
      <Button variant="text" color="primary" size="small" onClick={retry}>
        {t('scaffolder.repoUrlPicker.authRetry')}
      </Button>
    </Box>
  );
};

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
 *    support them. An explicit `allowedHosts` in the template still wins.
 *
 * 2. **Credentials.** The stock picker resolves `requestUserCredentials`
 *    through `scmAuthApi`, which is keyed **by host** and, in its default
 *    configuration, only knows github.com, gitlab.com, bitbucket.org and
 *    dev.azure.com — it throws for everything else. The stock picker still
 *    handles `requestUserCredentials` (so owner/repo autocomplete works), but
 *    runs inside a scoped `ApiProvider` where `scmAuthApi` obtains the token
 *    from the provider-level Backstage auth API, which is host-independent.
 *    See `useRepoUrlCredentials`.
 *
 * @public
 */
export const X2ARepoUrlPicker = (props: X2ARepoUrlPickerProps) => {
  const { t } = useTranslation();
  const defaultHosts = useDefaultHosts();
  const StockRepoUrlPicker = getStockRepoUrlPicker();

  const uiOptions = props.uiSchema?.['ui:options'] as
    | X2ARepoUrlPickerUiOptions
    | undefined;
  const hasExplicitHosts = !!uiOptions?.allowedHosts?.length;

  const title = props.schema?.title;
  const prefix = title ? `${title}: ` : '';

  const credentials = useRepoUrlCredentials({
    host: hostFromFormData(props.formData),
    options: uiOptions?.requestUserCredentials,
  });
  const { apis, attempt } = credentials;

  // `attempt` changes the identity on Retry, which re-runs the stock
  // picker's debounced credentials request.
  const uiSchema = useMemo(
    () =>
      ({
        ...props.uiSchema,
        'ui:options': {
          ...uiOptions,
          ...(hasExplicitHosts ? {} : { allowedHosts: defaultHosts }),
        },
      }) as FieldExtensionComponentProps<
        string,
        RepoUrlPickerUiOptions
      >['uiSchema'],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.uiSchema, uiOptions, hasExplicitHosts, defaultHosts, attempt],
  );

  if (!StockRepoUrlPicker) {
    return (
      <Typography color="error" variant="body2">
        {prefix}
        {t('scaffolder.repoUrlPicker.pickerUnavailable')}
      </Typography>
    );
  }

  return (
    <>
      <ApiProvider apis={apis}>
        <StockRepoUrlPicker
          {...(props as FieldExtensionComponentProps<
            string,
            RepoUrlPickerUiOptions
          >)}
          uiSchema={uiSchema}
        />
      </ApiProvider>
      <CredentialsStatusMessage credentials={credentials} />
    </>
  );
};

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

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
import { StatusError } from '@backstage/core-components';
import {
  RepoUrlPickerFieldExtension,
  type RepoUrlPickerUiOptions,
} from '@backstage/plugin-scaffolder';
import type {
  FieldExtensionComponentProps,
  FieldExtensionOptions,
} from '@backstage/plugin-scaffolder-react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';

import type { ScmProviderName } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useScmAuthHosts } from '../hooks/useScmAuthHosts';
import { providerLabels } from '../repoAuth';
import { useScmHostMap } from '../hooks/useScmHostMap';
import { useTranslation } from '../hooks/useTranslation';
import { useRepoUrlCredentials } from './useRepoUrlCredentials';
import type {
  X2ARepoUrlPickerProps,
  X2ARepoUrlPickerUiOptions,
} from './X2ARepoUrlPicker';

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
 * Default host list: GitHub and GitLab hosts from the frontend config, then
 * Bitbucket Cloud. Bitbucket Cloud's config is stripped from the frontend
 * config, so it comes from the integrations API (which always has
 * `bitbucket.org`). Public hosts that Backstage injects (github.com,
 * gitlab.com) are offered only when configured. When credentials are
 * requested, only the host each OAuth provider is registered against
 * (`x2a.scm.authHosts`) is offered; the others are returned in `hidden`, so
 * the field can say why they are missing. Bitbucket is the exception to that
 * notice: it is dropped silently because its host is always injected by
 * Backstage, so `x2a.scm.authHosts.bitbucket` is the only visible signal.
 */
function useDefaultHosts(onlyAuthHosts: boolean): {
  hosts: string[];
  hidden: HiddenHosts[];
} {
  const hostMap = useScmHostMap();
  const integrations = useApi(scmIntegrationsApiRef);
  const { authHostFor, isAuthHost } = useScmAuthHosts();
  return useMemo(() => {
    const byProvider = (name: ScmProviderName) =>
      Array.from(hostMap.entries())
        .filter(([, provider]) => provider === name)
        .map(([host]) => host);
    const bitbucketCloud = integrations.bitbucketCloud
      .list()
      .map(i => i.config.host);
    const offered: Array<[string, ScmProviderName]> = [
      ...byProvider('github').map(
        h => [h, 'github'] as [string, ScmProviderName],
      ),
      ...byProvider('gitlab').map(
        h => [h, 'gitlab'] as [string, ScmProviderName],
      ),
      ...bitbucketCloud.map(h => [h, 'bitbucket'] as [string, ScmProviderName]),
    ];
    // UX only: hosts whose token the guard in useRepoAuth would refuse are
    // not offered. The guard stays the security boundary.
    const allowed = ([host, provider]: [string, ScmProviderName]) =>
      !onlyAuthHosts || isAuthHost(host, provider);

    const hidden: HiddenHosts[] = [];
    for (const provider of ['github', 'gitlab'] as const) {
      const ofProvider = offered.filter(entry => entry[1] === provider);
      const hosts = ofProvider
        .filter(entry => !allowed(entry))
        .map(([host]) => host);
      if (hosts.length) {
        hidden.push({
          provider,
          hosts,
          authHost: authHostFor(provider),
          authHostListed: ofProvider.some(allowed),
        });
      }
    }

    return {
      hosts: Array.from(new Set(offered.filter(allowed).map(([host]) => host))),
      hidden,
    };
  }, [hostMap, integrations, authHostFor, isAuthHost, onlyAuthHosts]);
}

/** Hosts of one provider left out of the picker by `x2a.scm.authHosts`. */
type HiddenHosts = {
  provider: 'github' | 'gitlab';
  hosts: string[];
  /** The configured auth host, if any. */
  authHost?: string;
  /** Whether the auth host is one of the provider's integrations. */
  authHostListed: boolean;
};

/**
 * Explains why configured GitHub/GitLab hosts are missing from the picker, so
 * an unset or mismatching `x2a.scm.authHosts` does not just look like an
 * incomplete list.
 */
const HiddenHostsNotice = ({ hidden }: { hidden: HiddenHosts[] }) => {
  const { t } = useTranslation();
  if (!hidden.length) {
    return null;
  }
  return (
    <Box mt={1}>
      {hidden.map(({ provider, hosts, authHost, authHostListed }) => {
        const params = {
          provider: providerLabels[provider],
          hosts: hosts.join(', '),
          authHost: authHost ?? '',
          configKey: `x2a.scm.authHosts.${provider}`,
        };
        let message: string;
        if (!authHost) {
          message = t(
            'scaffolder.repoUrlPicker.hostsHiddenUnset' as any,
            params,
          );
        } else if (authHostListed) {
          message = t(
            'scaffolder.repoUrlPicker.hostsHiddenOther' as any,
            params,
          );
        } else {
          message = t(
            'scaffolder.repoUrlPicker.hostsHiddenNotListed' as any,
            params,
          );
        }
        return (
          <Typography
            key={provider}
            variant="caption"
            color="textSecondary"
            component="div"
          >
            {message}
          </Typography>
        );
      })}
    </Box>
  );
};

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
  const { authHostFor } = useScmAuthHosts();
  const { status, error, refused, retry } = credentials;
  const provider =
    (credentials.provider && providerLabels[credentials.provider]) ??
    credentials.host;

  if (status !== 'error' || !provider) {
    return null;
  }

  // A refused host is a configuration matter: say what to change, without a
  // Retry, which cannot succeed.
  if (refused) {
    const authHost = authHostFor(refused.provider);
    const params = {
      provider: providerLabels[refused.provider],
      host: refused.host,
      authHost: authHost ?? '',
      configKey: `x2a.scm.authHosts.${refused.provider}`,
    };
    return (
      <Box mt={1}>
        <StatusError>
          {authHost
            ? t('scaffolder.repoUrlPicker.hostRefusedOther' as any, params)
            : t('scaffolder.repoUrlPicker.hostRefusedUnset' as any, params)}
        </StatusError>
      </Box>
    );
  }

  return (
    <Box mt={1}>
      <StatusError>
        {t('scaffolder.repoUrlPicker.authError' as any, {
          provider,
          // The message is followed by ". " in the translation.
          error: (error ?? '').replace(/\.\s*$/, ''),
        })}
      </StatusError>
      <Button variant="text" color="primary" size="small" onClick={retry}>
        {t('scaffolder.repoUrlPicker.authRetry')}
      </Button>
    </Box>
  );
};

/**
 * The X2ARepoUrlPicker field itself. Loaded lazily by `X2ARepoUrlPicker`, so
 * that `@backstage/plugin-scaffolder`'s field extensions stay out of the
 * plugin's initial bundle.
 */
const X2ARepoUrlPickerImpl = (props: X2ARepoUrlPickerProps) => {
  const { t } = useTranslation();
  const { hosts: defaultHosts, hidden: hiddenHosts } = useDefaultHosts(
    !!props.uiSchema?.['ui:options']?.requestUserCredentials?.secretsKey,
  );
  const StockRepoUrlPicker = getStockRepoUrlPicker();

  const uiOptions = props.uiSchema?.['ui:options'] as
    | X2ARepoUrlPickerUiOptions
    | undefined;
  const hasExplicitHosts = !!uiOptions?.allowedHosts?.length;

  const title = props.schema?.title;
  const prefix = title ? `${title}: ` : '';

  const selectedHost = hostFromFormData(props.formData);
  const credentials = useRepoUrlCredentials({
    host: selectedHost,
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
      {!hasExplicitHosts && <HiddenHostsNotice hidden={hiddenHosts} />}
      <CredentialsStatusMessage credentials={credentials} />
    </>
  );
};

export default X2ARepoUrlPickerImpl;

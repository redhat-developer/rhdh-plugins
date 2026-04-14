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

// HACK: Backstage scaffolder >=1.36.1 (commit 527cf88) updated validation.ts
// to check for "bitbucketCloud"/"bitbucketServer" types, but RepoUrlPicker.tsx
// still only checks hostType === "bitbucket". Since
// integrationApi.byHost("bitbucket.org") returns a BitbucketCloudIntegration
// (type "bitbucketCloud"), the BitbucketRepoPicker (workspace/project fields)
// never renders. This wrapper fixes the type mismatch by intercepting the
// scmIntegrationsApi within the component's React context.
//
// Remove once upstream fixes RepoUrlPicker to handle the new type strings.

import { createElement, useMemo } from 'react';
import {
  type ApiHolder,
  type ApiRef,
  getComponentData,
  useApi,
  useApiHolder,
} from '@backstage/core-plugin-api';
import { ApiProvider } from '@backstage/core-app-api';
import { scmIntegrationsApiRef } from '@backstage/integration-react';
import {
  type FieldExtensionComponentProps,
  type FieldExtensionOptions,
} from '@backstage/plugin-scaffolder-react';
import { RepoUrlPickerFieldExtension } from '@backstage/plugin-scaffolder';

type IntegrationsApi =
  typeof scmIntegrationsApiRef extends ApiRef<infer T> ? T : never;

// Extract the original RepoUrlPicker component from the field extension's
// attached component data. This avoids importing from internal dist paths
// which are blocked by the package's "exports" field.
const FIELD_EXTENSION_KEY = 'scaffolder.extensions.field.v1';
const fieldExtensionData = getComponentData<FieldExtensionOptions>(
  createElement(RepoUrlPickerFieldExtension),
  FIELD_EXTENSION_KEY,
);

if (!fieldExtensionData?.component) {
  throw new Error(
    'Failed to extract RepoUrlPicker component from RepoUrlPickerFieldExtension. ' +
      'The Backstage scaffolder field extension data key may have changed.',
  );
}

const OriginalRepoUrlPicker = fieldExtensionData.component;

const BITBUCKET_TYPES = new Set(['bitbucketCloud', 'bitbucketServer']);

/**
 * Wraps the IntegrationsApi so that byHost() remaps "bitbucketCloud" and
 * "bitbucketServer" to "bitbucket", making the upstream RepoUrlPicker render
 * the BitbucketRepoPicker component.
 */
function wrapIntegrationsApi(api: IntegrationsApi): IntegrationsApi {
  return new Proxy(api, {
    get(target, prop, receiver) {
      if (prop !== 'byHost') {
        return Reflect.get(target, prop, receiver);
      }

      return (host: string) => {
        const integration = target.byHost(host);
        if (!integration || !BITBUCKET_TYPES.has(integration.type)) {
          return integration;
        }

        return new Proxy(integration, {
          get(innerTarget, innerProp, innerReceiver) {
            if (innerProp === 'type') {
              return 'bitbucket';
            }
            return Reflect.get(innerTarget, innerProp, innerReceiver);
          },
        });
      };
    },
  });
}

/**
 * Creates an ApiHolder that intercepts scmIntegrationsApiRef to return a
 * wrapped version, delegating all other API lookups to the parent holder.
 */
function createWrappedApiHolder(
  parentHolder: ApiHolder,
  wrappedIntegrations: IntegrationsApi,
): ApiHolder {
  return {
    get<T>(ref: ApiRef<T>): T | undefined {
      if (ref === scmIntegrationsApiRef) {
        return wrappedIntegrations as unknown as T;
      }
      return parentHolder.get(ref);
    },
  };
}

/**
 * Wrapper around Backstage's RepoUrlPicker that fixes the Bitbucket Cloud/Server
 * type mismatch. Provides a scoped API context override so the inner
 * RepoUrlPicker sees "bitbucket" as the host type and renders the
 * BitbucketRepoPicker with workspace/project fields.
 */
export function RepoUrlPickerWithBitbucketFix(
  props: FieldExtensionComponentProps<string>,
) {
  const parentHolder = useApiHolder();
  const integrationsApi = useApi(scmIntegrationsApiRef);

  const wrappedHolder = useMemo(
    () =>
      createWrappedApiHolder(
        parentHolder,
        wrapIntegrationsApi(integrationsApi),
      ),
    [parentHolder, integrationsApi],
  );

  return (
    <ApiProvider apis={wrappedHolder}>
      <OriginalRepoUrlPicker
        {...(props as FieldExtensionComponentProps<unknown>)}
      />
    </ApiProvider>
  );
}

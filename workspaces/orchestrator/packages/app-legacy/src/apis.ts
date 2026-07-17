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

import { isValidElement, ReactNode } from 'react';

import {
  alertApiRef,
  AnyApiFactory,
  configApiRef,
  createApiFactory,
} from '@backstage/core-plugin-api';
import { ToastApiMessage, toastApiRef } from '@backstage/frontend-plugin-api';
import {
  ScmAuth,
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';

const reactNodeToString = (node: ReactNode | null | undefined): string => {
  if (node === null || node === undefined) {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(reactNodeToString).join(' ');
  }
  if (isValidElement(node)) {
    return reactNodeToString(node.props.children);
  }
  return '';
};

const toastStatusToSeverity = (message: ToastApiMessage) => {
  const toastStatus = message.status ?? 'success';
  switch (toastStatus) {
    case 'warning':
      return 'warning';
    case 'danger':
      return 'error';
    case 'success':
      return 'success';
    default:
      return 'info';
  }
};

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: toastApiRef,
    deps: { alertApi: alertApiRef },
    factory: ({ alertApi }) => ({
      post(toast: ToastApiMessage) {
        alertApi.post({
          message: reactNodeToString(toast?.title),
          severity: toastStatusToSeverity(toast),
          display: 'transient',
        });

        return {
          close: () => {},
        };
      },
    }),
  }),
];

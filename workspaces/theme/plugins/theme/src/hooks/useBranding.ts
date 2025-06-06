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
import { ConfigApi, configApiRef, useApi } from '@backstage/core-plugin-api';
import { Branding } from '../types';

export const useBranding = (): Branding | undefined => {
  let configApi: ConfigApi | undefined = undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    configApi = useApi(configApiRef);
  } catch (err) {
    // useApi won't be initialized initially in createApp theme provider, and will get updated later
  }
  return useMemo(() => {
    const branding = configApi?.getOptional<Branding>('app.branding');
    return branding;
  }, [configApi]);
};

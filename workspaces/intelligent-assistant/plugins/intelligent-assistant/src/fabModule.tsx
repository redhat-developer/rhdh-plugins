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

import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { AppRootWrapperBlueprint } from '@backstage/plugin-app-react';

import './muiClassNameConfig';

import { LIGHTSPEED_LEGACY_PATH, LIGHTSPEED_PATH } from './const';
import { LazyLightspeedFabRootWrapper } from './lazy/LazyLightspeedFabRootWrapper';

const LightspeedLegacyRedirect = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname.startsWith(LIGHTSPEED_LEGACY_PATH)) {
      const newPath = location.pathname.replace(
        LIGHTSPEED_LEGACY_PATH,
        LIGHTSPEED_PATH,
      );
      navigate(newPath + location.search + location.hash, {
        replace: true,
      });
    }
  }, [location, navigate]);

  // Workaround: PF 6.6.0 base-no-reset.css sets container-type: inline-size on :root,
  // breaking body height. Remove after https://github.com/patternfly/patternfly-react/issues/12568
  useLayoutEffect(() => {
    document.documentElement.style.containerType = 'normal';
  }, []);

  return <>{children}</>;
};

const intelligentAssistantRedirect = AppRootWrapperBlueprint.make({
  name: 'intelligent-assistant-redirect',
  params: {
    component: LightspeedLegacyRedirect,
  },
});

/**
 * @public
 */
export const intelligentAssistantRedirectModule = createFrontendModule({
  pluginId: 'app',
  extensions: [intelligentAssistantRedirect],
});

const intelligentAssistantFABExtension = AppRootWrapperBlueprint.make({
  name: 'intelligent-assistant-fab',
  params: {
    component: LazyLightspeedFabRootWrapper,
  },
});

/**
 * @public
 */
export const intelligentAssistantFABModule = createFrontendModule({
  pluginId: 'app',
  extensions: [intelligentAssistantFABExtension, intelligentAssistantRedirect],
});

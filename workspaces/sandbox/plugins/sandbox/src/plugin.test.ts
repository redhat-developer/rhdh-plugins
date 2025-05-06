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
import {
  sandboxPlugin,
  SandboxPage,
  SandboxActivitiesPage,
  SandboxHomeIcon,
  SandboxActivitiesIcon,
} from './plugin';
import {
  registerApiRef,
  kubeApiRef,
  aapApiRef,
  keycloakApiRef,
  secureFetchApiRef,
} from './api';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import {
  configApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';

jest.mock('./components/SandboxCatalog/SandboxCatalogPage', () => ({
  SandboxCatalogPage: jest.fn(),
}));

jest.mock('./components/SandboxActivities/SandboxActivitiesPage', () => ({
  SandboxActivitiesPage: jest.fn(),
}));

describe('sandbox plugin', () => {
  it('should create plugin with correct configuration', () => {
    expect(sandboxPlugin).toBeDefined();
    expect(sandboxPlugin.getId()).toBe('sandbox');
  });

  it('should register all required APIs', () => {
    const apis = [...sandboxPlugin.getApis()];

    expect(apis).toHaveLength(5);

    const apiRefs = apis.map((api: any) => api.api);
    expect(apiRefs).toContain(registerApiRef);
    expect(apiRefs).toContain(kubeApiRef);
    expect(apiRefs).toContain(aapApiRef);
    expect(apiRefs).toContain(keycloakApiRef);
    expect(apiRefs).toContain(secureFetchApiRef);
  });

  describe('routable extensions', () => {
    it('should export SandboxPage component', () => {
      expect(SandboxPage).toBeDefined();
      const extension = sandboxPlugin.routes.root;
      expect(extension).toBeDefined();
    });

    it('should export SandboxActivitiesPage component', () => {
      expect(SandboxActivitiesPage).toBeDefined();
      const extension = sandboxPlugin.routes.root;
      expect(extension).toBeDefined();
    });
  });

  describe('icons', () => {
    it('should export SandboxHomeIcon', () => {
      expect(SandboxHomeIcon).toBeDefined();
      expect(SandboxHomeIcon).toBe(HomeOutlinedIcon);
    });

    it('should export SandboxActivitiesIcon', () => {
      expect(SandboxActivitiesIcon).toBeDefined();
      expect(SandboxActivitiesIcon).toBe(StarOutlineOutlinedIcon);
    });
  });

  describe('API factories', () => {
    it('should create registration API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const registrationApiFactory = apis.find(
        (api: any) => api.api === registerApiRef,
      );

      expect(registrationApiFactory).toBeDefined();
      expect(registrationApiFactory?.deps.configApi).toBe(configApiRef);
      expect(registrationApiFactory?.deps.secureFetchApi).toBe(
        secureFetchApiRef,
      );
    });

    it('should create kube API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const kubeApiFactory = apis.find((api: any) => api.api === kubeApiRef);

      expect(kubeApiFactory).toBeDefined();
      expect(kubeApiFactory?.deps.configApi).toBe(configApiRef);
      expect(kubeApiFactory?.deps.secureFetchApi).toBe(secureFetchApiRef);
    });

    it('should create AAP API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const aapApiFactory = apis.find((api: any) => api.api === aapApiRef);

      expect(aapApiFactory).toBeDefined();
      expect(aapApiFactory?.deps.configApi).toBe(configApiRef);
      expect(aapApiFactory?.deps.secureFetchApi).toBe(secureFetchApiRef);
    });

    it('should create keycloak API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const keycloakApiFactory = apis.find(
        (api: any) => api.api === keycloakApiRef,
      );

      expect(keycloakApiFactory).toBeDefined();
      expect(keycloakApiFactory?.deps.discoveryApi).toBe(discoveryApiRef);
      expect(keycloakApiFactory?.deps.oauthRequestApi).toBe(oauthRequestApiRef);
      expect(keycloakApiFactory?.deps.configApi).toBe(configApiRef);
    });

    it('should create secure fetch API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const secureFetchApiFactory = apis.find(
        (api: any) => api.api === secureFetchApiRef,
      );

      expect(secureFetchApiFactory).toBeDefined();
      expect(secureFetchApiFactory?.deps.oauthApi).toBe(keycloakApiRef);
    });
  });
});

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

    // Check if we have 4 API factories
    expect(apis).toHaveLength(5);

    // Check if each API is properly registered
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
      const registrationApi = apis.find(
        (api: any) => api.api === registerApiRef,
      );

      expect(registrationApi).toBeDefined();
      expect(registrationApi?.deps).toEqual({
        configApi: expect.any(Object),
        discoveryApi: expect.any(Object),
        secureFetchApi: secureFetchApiRef,
      });
    });

    it('should create kube API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const kubeApi = apis.find((api: any) => api.api === kubeApiRef);

      expect(kubeApi).toBeDefined();
      expect(kubeApi?.deps).toEqual({
        discoveryApi: expect.any(Object),
        secureFetchApi: secureFetchApiRef,
      });
    });

    it('should create AAP API factory with correct dependencies', () => {
      const apis = [...sandboxPlugin.getApis()];
      const aapApi = apis.find((api: any) => api.api === aapApiRef);

      expect(aapApi).toBeDefined();
      expect(aapApi?.deps).toEqual({
        discoveryApi: expect.any(Object),
        secureFetchApi: secureFetchApiRef,
      });
    });
  });

  it('should create keycloak API factory with correct dependencies', () => {
    const apis = [...sandboxPlugin.getApis()];
    const keycloakApi = apis.find((api: any) => api.api === keycloakApiRef);

    expect(keycloakApi).toBeDefined();
    expect(keycloakApi?.deps).toEqual({
      discoveryApi: expect.any(Object),
      oauthRequestApi: expect.any(Object),
      configApi: expect.any(Object),
    });
  });

  it('should create secure fetch API factory with correct dependencies', () => {
    const apis = [...sandboxPlugin.getApis()];
    const secureFetchApi = apis.find(
      (api: any) => api.api === secureFetchApiRef,
    );

    expect(secureFetchApi).toBeDefined();
    expect(secureFetchApi?.deps).toEqual({
      oauthApi: keycloakApiRef,
    });
  });
});

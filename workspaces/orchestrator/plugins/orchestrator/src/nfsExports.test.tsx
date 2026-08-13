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
import plugin, { orchestratorTranslationsModule } from './index';
import translationsModuleDefault from './orchestratorTranslationsModuleExport';

describe('orchestrator NFS plugin test', () => {
  it('should export a valid frontend plugin', () => {
    expect(plugin).toBeDefined();
    expect(plugin.$$type).toBe('@backstage/FrontendPlugin');
  });

  it('should have the correct plugin id', () => {
    expect(plugin.id).toBe('orchestrator');
  });

  it('should have routes defined', () => {
    expect(plugin.routes).toBeDefined();
    expect(plugin.routes).toHaveProperty('root');
  });

  it('should export a translations module targeting the app plugin', () => {
    expect(orchestratorTranslationsModule).toBeDefined();
    expect(orchestratorTranslationsModule.$$type).toBe(
      '@backstage/FrontendModule',
    );
  });

  it('should export the translations module as default for NFS discovery', () => {
    expect(translationsModuleDefault).toBe(orchestratorTranslationsModule);
  });
});

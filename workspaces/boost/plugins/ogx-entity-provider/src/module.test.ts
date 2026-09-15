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

import { ConfigReader } from '@backstage/config';

import { readOgxEntityProviderConfig } from './module';

describe('readOgxEntityProviderConfig', () => {
  it('reads caData and skipTLSVerify from boost.entityProviders.ogx', () => {
    const config = new ConfigReader({
      boost: {
        entityProviders: {
          ogx: {
            baseUrl: 'https://ogx.example.com',
            caData:
              '-----BEGIN CERTIFICATE-----\nMIIBxTCC...\n-----END CERTIFICATE-----',
            skipTLSVerify: true,
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('https://ogx.example.com');
    expect(result.caData).toBe(
      '-----BEGIN CERTIFICATE-----\nMIIBxTCC...\n-----END CERTIFICATE-----',
    );
    expect(result.skipTLSVerify).toBe(true);
  });

  it('reads caData and skipTLSVerify from fallback boost.providers.ogx', () => {
    const config = new ConfigReader({
      boost: {
        providers: {
          ogx: {
            baseUrl: 'https://ogx-fallback.example.com',
            caData: 'PEM-CERT-DATA',
            skipTLSVerify: false,
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('https://ogx-fallback.example.com');
    expect(result.caData).toBe('PEM-CERT-DATA');
    expect(result.skipTLSVerify).toBe(false);
  });

  it('returns undefined for caData and skipTLSVerify when not configured', () => {
    const config = new ConfigReader({
      boost: {
        entityProviders: {
          ogx: {
            baseUrl: 'http://localhost:8321',
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('http://localhost:8321');
    expect(result.caData).toBeUndefined();
    expect(result.skipTLSVerify).toBeUndefined();
  });

  it('falls back to localhost when no OGX config is present', () => {
    const config = new ConfigReader({});

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('http://localhost:8321');
    expect(result.caData).toBeUndefined();
    expect(result.skipTLSVerify).toBeUndefined();
  });

  it('prefers entityProviders.ogx over providers.ogx', () => {
    const config = new ConfigReader({
      boost: {
        entityProviders: {
          ogx: {
            baseUrl: 'https://primary.example.com',
            caData: 'PRIMARY-CA',
          },
        },
        providers: {
          ogx: {
            baseUrl: 'https://fallback.example.com',
            caData: 'FALLBACK-CA',
          },
        },
      },
    });

    const result = readOgxEntityProviderConfig(config);

    expect(result.baseUrl).toBe('https://primary.example.com');
    expect(result.caData).toBe('PRIMARY-CA');
  });
});

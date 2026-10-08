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

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { ConfigReader } from '@backstage/config';
import { loadCaBundle, createHttpsAgent } from './ca-bundle';

// Valid PEM certificate for testing
const VALID_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALRiMLAh0GRFMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RjYTAeFw0yMzAxMDEwMDAwMDBaFw0yNDAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RjYTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQDFyP0DJhJi8XwFI5fDiX7g
TzP2fjnbN3UNe0E5lPUBbx3mKKL6XxOaxf1C1ZP0NeW4jMqUPP8AByEJrq+7JikC
AwEAAaNTMFEwHQYDVR0OBBYEFBkIra39eRYFI1MzRITO3RVjIiJbMB8GA1UdIwQY
MBaAFBkIra39eRYFI1MzRITO3RVjIiJbMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADQQBGIjYqgRJHJBD7KEz1YLzUhVJxZnMHQP0sT4OI+/+3g1CLDYJ
v6PTXLV5V3LfTxH+8cITsh8R+C/PN5MVyNg/
-----END CERTIFICATE-----`;

const SECOND_PEM = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJALRiMLAh0GRFMA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMMBnRl
c3RjYTAeFw0yMzAxMDEwMDAwMDBaFw0yNDAxMDEwMDAwMDBaMBExDzANBgNVBAMM
BnRlc3RjYTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQDFyP0DJhJi8XwFI5fDiX7g
TzP2fjnbN3UNe0E5lPUBbx3mKKL6XxOaxf1C1ZP0NeW4jMqUPP8AByEJrq+7JikC
AwEAAaNTMFEwHQYDVR0OBBYEFBkIra39eRYFI1MzRITO3RVjIiJbMB8GA1UdIwQY
MBaAFBkIra39eRYFI1MzRITO3RVjIiJbMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZI
hvcNAQELBQADQQBGIjYqgRJHJBD7KEz1YLzUhVJxZnMHQP0sT4OI+/+3g1CLDYJ
v6PTXLV5V3LfTxH+8cITsh8R+C/PN5MVyNg/
-----END CERTIFICATE-----`;

function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

describe('loadCaBundle', () => {
  let tmpDir: string;
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-bundle-test-'));
    logger = createMockLogger();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns undefined when no tls block is configured', () => {
    const config = new ConfigReader({});
    expect(loadCaBundle(config, logger)).toBeUndefined();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('loads CA from file path (tls.caFile)', () => {
    const caPath = path.join(tmpDir, 'ca.pem');
    fs.writeFileSync(caPath, VALID_PEM);

    const config = new ConfigReader({ tls: { caFile: caPath } });
    const result = loadCaBundle(config, logger);

    expect(result).toBeInstanceOf(Buffer);
    expect(result!.toString('utf-8')).toContain('-----BEGIN CERTIFICATE-----');
  });

  it('prefers tls.caFile over tls.caSecret and warns when both are set', () => {
    const caPath = path.join(tmpDir, 'ca.pem');
    fs.writeFileSync(caPath, VALID_PEM);

    const config = new ConfigReader({
      tls: {
        caFile: caPath,
        caSecret: SECOND_PEM,
      },
    });
    const result = loadCaBundle(config, logger);

    expect(result).toBeInstanceOf(Buffer);
    expect(result!.toString('utf-8')).toEqual(fs.readFileSync(caPath, 'utf-8'));
    expect(logger.warn).toHaveBeenCalledWith(
      'Both tls.caFile and tls.caSecret are set; using tls.caFile and ignoring tls.caSecret',
      expect.objectContaining({ caFile: caPath }),
    );
  });

  it('loads CA from environment variable (tls.caSecret resolved via $env)', () => {
    // In production, Backstage resolves { $env: "VAR" } at config
    // loading time. By the time our code sees it, the value is a
    // plain string containing the PEM content.
    const config = new ConfigReader({
      tls: { caSecret: VALID_PEM },
    });
    const result = loadCaBundle(config, logger);

    expect(result).toBeInstanceOf(Buffer);
    expect(result!.toString('utf-8')).toContain('-----BEGIN CERTIFICATE-----');
  });

  it('returns undefined and logs WARN for missing CA file', () => {
    const missingPath = path.join(tmpDir, 'missing.pem');
    const config = new ConfigReader({ tls: { caFile: missingPath } });

    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      'CA file not found',
      expect.objectContaining({ caFile: missingPath }),
    );
  });

  it('returns undefined and logs ERROR for invalid PEM data', () => {
    const invalidPath = path.join(tmpDir, 'invalid.pem');
    fs.writeFileSync(invalidPath, 'this is not a PEM file');

    const config = new ConfigReader({ tls: { caFile: invalidPath } });
    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'CA file does not contain valid PEM data',
      expect.objectContaining({ caFile: invalidPath }),
    );
  });

  it('returns undefined and logs ERROR for truncated PEM missing footer', () => {
    const truncatedPath = path.join(tmpDir, 'truncated.pem');
    fs.writeFileSync(
      truncatedPath,
      '-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJALRiMLAh0GRF\n',
    );

    const config = new ConfigReader({ tls: { caFile: truncatedPath } });
    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'CA file does not contain valid PEM data',
      expect.objectContaining({ caFile: truncatedPath }),
    );
  });

  it('returns undefined and logs ERROR when a chain has a truncated trailing cert', () => {
    const truncatedChainPath = path.join(tmpDir, 'truncated-chain.pem');
    fs.writeFileSync(
      truncatedChainPath,
      `${VALID_PEM}\n-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJALRiMLAh0GRF\n`,
    );

    const config = new ConfigReader({ tls: { caFile: truncatedChainPath } });
    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'CA file does not contain valid PEM data',
      expect.objectContaining({ caFile: truncatedChainPath }),
    );
  });

  it('supports CA certificate chains (multiple PEM blocks)', () => {
    const chainPath = path.join(tmpDir, 'chain.pem');
    const chain = `${VALID_PEM}\n${SECOND_PEM}`;
    fs.writeFileSync(chainPath, chain);

    const config = new ConfigReader({ tls: { caFile: chainPath } });
    const result = loadCaBundle(config, logger);

    expect(result).toBeInstanceOf(Buffer);
    const content = result!.toString('utf-8');
    // Should contain both certificates
    const matches = content.match(/-----BEGIN CERTIFICATE-----/g);
    expect(matches).toHaveLength(2);
  });

  it('isolates per-connector CA bundles', () => {
    const caPathA = path.join(tmpDir, 'ca-a.pem');
    const caPathB = path.join(tmpDir, 'ca-b.pem');
    fs.writeFileSync(caPathA, VALID_PEM);
    fs.writeFileSync(caPathB, SECOND_PEM);

    const configA = new ConfigReader({ tls: { caFile: caPathA } });
    const configB = new ConfigReader({ tls: { caFile: caPathB } });

    const resultA = loadCaBundle(configA, logger);
    const resultB = loadCaBundle(configB, logger);

    expect(resultA).toBeInstanceOf(Buffer);
    expect(resultB).toBeInstanceOf(Buffer);
    // Each gets its own file content
    expect(resultA!.toString('utf-8')).toEqual(
      fs.readFileSync(caPathA, 'utf-8'),
    );
    expect(resultB!.toString('utf-8')).toEqual(
      fs.readFileSync(caPathB, 'utf-8'),
    );
  });

  it('returns undefined for empty caSecret value', () => {
    // Simulate a resolved $env that pointed to an empty env var.
    // Backstage's ConfigReader rejects empty strings, so this
    // scenario results in the caSecret key being absent or
    // erroring. We test the code path where it is simply not set.
    const config = new ConfigReader({ tls: {} });
    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
  });

  it('returns undefined for caSecret with invalid PEM data', () => {
    // Simulate a resolved $env value containing non-PEM data
    const config = new ConfigReader({
      tls: { caSecret: 'not-pem-data' },
    });
    const result = loadCaBundle(config, logger);

    expect(result).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'CA secret does not contain valid PEM data',
    );
  });
});

describe('createHttpsAgent', () => {
  it('returns undefined when no CA bundle is provided', () => {
    expect(createHttpsAgent(undefined)).toBeUndefined();
  });

  it('creates an https.Agent with the provided CA bundle', () => {
    const ca = Buffer.from(VALID_PEM, 'utf-8');
    const agent = createHttpsAgent(ca);

    expect(agent).toBeDefined();
    expect(agent!.options.ca).toEqual(ca);
  });
});

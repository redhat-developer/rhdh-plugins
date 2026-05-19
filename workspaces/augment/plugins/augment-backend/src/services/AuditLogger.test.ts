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

import { AuditLogger } from './AuditLogger';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Request } from 'express';

function createMockLogger(): LoggerService & {
  calls: Array<{ method: string; args: unknown[] }>;
} {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const child: LoggerService = {
    info: (...args: unknown[]) => calls.push({ method: 'info', args }),
    warn: (...args: unknown[]) => calls.push({ method: 'warn', args }),
    error: (...args: unknown[]) => calls.push({ method: 'error', args }),
    debug: (...args: unknown[]) => calls.push({ method: 'debug', args }),
    child: () => child,
  };
  return Object.assign(child, { calls });
}

describe('AuditLogger', () => {
  it('logs audit events as structured metadata (not JSON-in-JSON)', () => {
    const logger = createMockLogger();
    const audit = new AuditLogger(logger);

    audit.log({
      action: 'config.update',
      actor: 'user:default/admin',
      target: 'chatAgents',
      outcome: 'success',
      sourceIp: '10.0.0.1',
      meta: { providerId: 'llamastack' },
    });

    expect(logger.calls).toHaveLength(1);
    const [call] = logger.calls;
    expect(call.method).toBe('info');
    expect(call.args[0]).toBe('audit');
    const payload = call.args[1] as Record<string, unknown>;
    expect(payload.action).toBe('config.update');
    expect(payload.actor).toBe('user:default/admin');
    expect(payload.target).toBe('chatAgents');
    expect(payload.outcome).toBe('success');
    expect(payload.sourceIp).toBe('10.0.0.1');
    expect(payload.providerId).toBe('llamastack');
    expect(payload.timestamp).toBeDefined();
  });

  it('logs failure events', () => {
    const logger = createMockLogger();
    const audit = new AuditLogger(logger);

    audit.log({
      action: 'session.delete',
      actor: 'user:default/dev',
      target: 'sess-404',
      outcome: 'failure',
    });

    const payload = logger.calls[0].args[1] as Record<string, unknown>;
    expect(payload.outcome).toBe('failure');
  });
});

describe('AuditLogger.extractIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.50, 70.41.3.18' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    expect(AuditLogger.extractIp(req)).toBe('203.0.113.50');
  });

  it('falls back to socket remoteAddress', () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '::1' },
    } as unknown as Request;

    expect(AuditLogger.extractIp(req)).toBe('::1');
  });

  it('returns unknown when no IP available', () => {
    const req = {
      headers: {},
      socket: {},
    } as unknown as Request;

    expect(AuditLogger.extractIp(req)).toBe('unknown');
  });
});

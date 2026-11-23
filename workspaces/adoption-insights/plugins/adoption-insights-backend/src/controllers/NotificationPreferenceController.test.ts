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

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import type { Request, Response } from 'express';
import { NotificationPreferenceStore } from '../database/NotificationPreferenceStore';
import { NotificationPreferenceController } from './NotificationPreferenceController';

describe('NotificationPreferenceController', () => {
  const store = {
    get: jest.fn(),
    set: jest.fn(),
  };
  const auditEvent = { success: jest.fn(), fail: jest.fn() };
  const auditor = { createEvent: jest.fn() };
  const httpAuth = mockServices.httpAuth.mock();
  const controller = new NotificationPreferenceController(
    store as unknown as NotificationPreferenceStore,
    auditor as any,
    httpAuth,
  );
  const req = { body: {} } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    req.body = {};
    auditor.createEvent.mockResolvedValue(auditEvent);
    jest
      .mocked(httpAuth.credentials)
      .mockResolvedValue(mockCredentials.user('user:default/alice'));
  });

  it('returns off when the caller has no row without auditing', async () => {
    store.get.mockResolvedValue(undefined);
    await controller.getPreference(req, res);
    expect(store.get).toHaveBeenCalledWith('user:default/alice');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ frequency: 'off' });
    expect(auditor.createEvent).not.toHaveBeenCalled();
  });

  it('saves the caller preference and audits the change', async () => {
    req.body = { frequency: 'weekly' };
    store.set.mockResolvedValue({ previous: 'daily' });
    await controller.updatePreference(req, res);
    expect(store.set).toHaveBeenCalledWith('user:default/alice', 'weekly');
    expect(auditor.createEvent).toHaveBeenCalledWith({
      eventId: 'notification-preference-update',
      severityLevel: 'medium',
      request: req,
    });
    expect(auditEvent.success).toHaveBeenCalledWith({
      meta: { frequency: 'weekly', previousFrequency: 'daily' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ frequency: 'weekly' });
  });

  it.each([
    { frequency: '7d' },
    { frequency: '30d' },
    { frequency: 'never' },
    { frequency: '' },
    {},
    { frequency: 7 },
    { frequency: 'weekly', userRef: 'user:default/bob' },
  ])('rejects invalid request body %j', async body => {
    req.body = body;
    await controller.updatePreference(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid notification preference',
      errors: expect.any(Object),
      formErrors: expect.any(Array),
    });
    expect(auditEvent.fail).toHaveBeenCalledWith({
      error: expect.any(Error),
    });
    expect(store.set).not.toHaveBeenCalled();
  });

  it('reports extra body keys in formErrors', async () => {
    req.body = { frequency: 'weekly', userRef: 'user:default/bob' };
    await controller.updatePreference(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid notification preference',
      errors: {},
      formErrors: [expect.stringContaining('userRef')],
    });
    expect(store.set).not.toHaveBeenCalled();
  });

  it('audits and rethrows a store error', async () => {
    const error = new Error('database unavailable');
    req.body = { frequency: 'monthly' };
    store.set.mockRejectedValue(error);
    await expect(controller.updatePreference(req, res)).rejects.toThrow(error);
    expect(auditEvent.fail).toHaveBeenCalledWith({ error });
    expect(auditEvent.success).not.toHaveBeenCalled();
  });
});

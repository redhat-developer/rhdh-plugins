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
import { Event } from './Event';
import { AnalyticsEvent } from '@backstage/core-plugin-api';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mocked-uuid') }));

describe('Event Class', () => {
  const mockEvent: AnalyticsEvent = {
    action: 'test-action',
    subject: 'test-subject',
    value: 42,
    context: {
      routeRef: 'test-route',
      pluginId: 'test-plugin',
      extension: 'routeRef',
      userName: 'test-user',
      timestamp: '2025-03-02T16:25:32.819Z',
    },
    attributes: { key: 'value' },
  };

  it('should correctly initialize properties with JSON context', () => {
    const eventInstance = new Event(mockEvent, true);

    expect(eventInstance.id).toBe('mocked-uuid');
    expect(eventInstance.user_ref).toBe('test-user');
    expect(eventInstance.plugin_id).toBe('test-plugin');
    expect(eventInstance.action).toBe('test-action');
    expect(eventInstance.subject).toBe('test-subject');
    expect(eventInstance.value).toBe(42);
    expect(eventInstance.created_at).toBe('2025-03-02T16:25:32.819Z');
    expect(eventInstance.context).toEqual({
      routeRef: 'test-route',
      pluginId: 'test-plugin',
      extension: 'routeRef',
      userName: 'test-user',
      timestamp: '2025-03-02T16:25:32.819Z',
    });
    expect(eventInstance.attributes).toEqual({ key: 'value' });
  });

  it('should correctly initialize properties with stringified context and attributes', () => {
    const eventInstance = new Event(mockEvent, false);

    expect(eventInstance.context).toBe(JSON.stringify(mockEvent.context));
    expect(eventInstance.attributes).toBe(JSON.stringify(mockEvent.attributes));
  });

  it('should return correct JSON representation', () => {
    const eventInstance = new Event(mockEvent, true);
    expect(eventInstance.toJSON()).toEqual({
      user_ref: 'test-user',
      plugin_id: 'test-plugin',
      action: 'test-action',
      context: mockEvent.context,
      subject: 'test-subject',
      attributes: mockEvent.attributes,
      created_at: '2025-03-02T16:25:32.819Z',
      value: 42,
    });
  });

  it('should return empty object for missing attributes', () => {
    const eventInstanceWithJsonValue = new Event(
      { ...mockEvent, attributes: undefined },
      true,
    );
    expect(eventInstanceWithJsonValue.toJSON()).toEqual(
      expect.objectContaining({
        attributes: {},
      }),
    );
    const eventInstanceWithoutJsonValue = new Event(
      {
        ...mockEvent,
        attributes: undefined,
      },
      false,
    );
    expect(eventInstanceWithoutJsonValue.toJSON()).toEqual(
      expect.objectContaining({
        attributes: '{}',
      }),
    );
  });
});

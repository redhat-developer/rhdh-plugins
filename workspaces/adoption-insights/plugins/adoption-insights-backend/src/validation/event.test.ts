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
import { validateEvent } from './event';

describe('EventSchema', () => {
  it('should validate a correct event', () => {
    const validEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: { key: 'value' }, // Valid JSON object
      subject: 'some-subject',
      attributes: { key: true },
      value: 100,
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should reject missing user_ref', () => {
    const invalidEvent = {
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
    };

    expect(() => validateEvent(invalidEvent)).toThrow();
  });

  it('should reject missing plugin_id', () => {
    const invalidEvent = {
      user_ref: 'user-123',
      action: 'click',
      context: '{}',
    };

    expect(() => validateEvent(invalidEvent)).toThrow('Plugin ID is required');
  });

  it('should reject missing action', () => {
    const invalidEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      context: '{}',
    };

    expect(() => validateEvent(invalidEvent)).toThrow('Action is required');
  });

  it('should accept context as a string', () => {
    const validEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{"key":"value"}',
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should accept attributes as a string', () => {
    const validEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
      attributes: '{"key":true}',
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should reject invalid context type', () => {
    const invalidEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: 123,
    };

    expect(() => validateEvent(invalidEvent)).toThrow();
  });

  it('should reject invalid attributes type', () => {
    const invalidEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
      attributes: 123, // Invalid type
    };

    expect(() => validateEvent(invalidEvent)).toThrow();
  });

  it('should allow optional subject', () => {
    const validEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should allow optional value', () => {
    const validEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
      value: 42,
    };

    expect(() => validateEvent(validEvent)).not.toThrow();
  });

  it('should reject invalid value type', () => {
    const invalidEvent = {
      user_ref: 'user-123',
      plugin_id: 'plugin-xyz',
      action: 'click',
      context: '{}',
      value: '42',
    };

    expect(() => validateEvent(invalidEvent)).toThrow();
  });
});

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
import { isPluginDisabled, parseMaxEntrySize } from './types';

describe('parseMaxEntrySize', () => {
  const DEFAULT = 40_000_000;

  it('returns the default when unset', () => {
    expect(parseMaxEntrySize()).toBe(DEFAULT);
  });

  it('returns the default when empty', () => {
    expect(parseMaxEntrySize('')).toBe(DEFAULT);
  });

  it('returns the parsed value for a positive integer', () => {
    expect(parseMaxEntrySize('1000')).toBe(1000);
  });

  it('falls back to the default for a non-numeric value (no silent NaN)', () => {
    expect(parseMaxEntrySize('abc')).toBe(DEFAULT);
  });

  it('falls back to the default for zero', () => {
    expect(parseMaxEntrySize('0')).toBe(DEFAULT);
  });

  it('falls back to the default for a negative value', () => {
    expect(parseMaxEntrySize('-100')).toBe(DEFAULT);
  });

  it('falls back to the default for NaN', () => {
    expect(parseMaxEntrySize('NaN')).toBe(DEFAULT);
  });
});

describe('isPluginDisabled', () => {
  it('returns false when neither enabled nor disabled is set', () => {
    expect(isPluginDisabled({ package: 'pkg@1.0' })).toBe(false);
  });

  it('returns false when enabled: true', () => {
    expect(isPluginDisabled({ package: 'pkg@1.0', enabled: true })).toBe(false);
  });

  it('returns true when enabled: false', () => {
    expect(isPluginDisabled({ package: 'pkg@1.0', enabled: false })).toBe(true);
  });

  it('returns true when disabled: true (backward compat)', () => {
    expect(isPluginDisabled({ package: 'pkg@1.0', disabled: true })).toBe(true);
  });

  it('returns false when disabled: false (backward compat)', () => {
    expect(isPluginDisabled({ package: 'pkg@1.0', disabled: false })).toBe(
      false,
    );
  });

  it('enabled takes precedence over disabled when both set (enabled: true, disabled: true)', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      { package: 'pkg@1.0', enabled: true, disabled: true },
      msg => warnings.push(msg),
    );
    expect(result).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/both 'enabled' and 'disabled'/);
  });

  it('enabled takes precedence over disabled when both set (enabled: false, disabled: false)', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      { package: 'pkg@1.0', enabled: false, disabled: false },
      msg => warnings.push(msg),
    );
    expect(result).toBe(true);
    expect(warnings).toHaveLength(1);
  });

  it('does not warn when no callback provided', () => {
    expect(
      isPluginDisabled({ package: 'pkg@1.0', enabled: true, disabled: true }),
    ).toBe(false);
  });

  it('treats non-boolean enabled as unset (string "false" is not false)', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      { package: 'pkg@1.0', enabled: 'false' as unknown as boolean },
      msg => warnings.push(msg),
    );
    expect(result).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/non-boolean 'enabled: false'/);
  });

  it('treats null enabled as unset', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      { package: 'pkg@1.0', enabled: null as unknown as boolean },
      msg => warnings.push(msg),
    );
    expect(result).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/non-boolean 'enabled: null'/);
  });

  it('treats non-boolean disabled as unset', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      { package: 'pkg@1.0', disabled: 'true' as unknown as boolean },
      msg => warnings.push(msg),
    );
    expect(result).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/non-boolean 'disabled: true'/);
  });

  it('falls back to valid disabled when enabled is non-boolean', () => {
    const warnings: string[] = [];
    const result = isPluginDisabled(
      {
        package: 'pkg@1.0',
        enabled: 'yes' as unknown as boolean,
        disabled: true,
      },
      msg => warnings.push(msg),
    );
    expect(result).toBe(true);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/non-boolean 'enabled/);
  });
});

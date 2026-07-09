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
  computeTotalTimeSaved,
  parseTimeSavedMinutes,
} from './formatTimeSaved';

describe('computeTotalTimeSaved', () => {
  it('returns null when annotation is undefined', () => {
    expect(computeTotalTimeSaved(undefined, 5)).toBeNull();
  });

  it('returns null when annotation is empty string', () => {
    expect(computeTotalTimeSaved('', 5)).toBeNull();
  });

  it('returns null when annotation is non-numeric', () => {
    expect(computeTotalTimeSaved('abc', 5)).toBeNull();
  });

  it('returns null when annotation is zero', () => {
    expect(computeTotalTimeSaved('0', 5)).toBeNull();
  });

  it('returns null when annotation is negative', () => {
    expect(computeTotalTimeSaved('-10', 5)).toBeNull();
  });

  it('returns null when count is zero', () => {
    expect(computeTotalTimeSaved('180', 0)).toBeNull();
  });

  it('returns minutes only when total is under 60', () => {
    expect(computeTotalTimeSaved('10', 3)).toEqual({
      days: 0,
      hours: 0,
      minutes: 30,
    });
  });

  it('returns hours only when total is exact hours under 24', () => {
    expect(computeTotalTimeSaved('60', 2)).toEqual({
      days: 0,
      hours: 2,
      minutes: 0,
    });
  });

  it('returns hours and minutes', () => {
    expect(computeTotalTimeSaved('90', 1)).toEqual({
      days: 0,
      hours: 1,
      minutes: 30,
    });
  });

  it('returns days and hours when over 24 hours', () => {
    expect(computeTotalTimeSaved('60', 28)).toEqual({
      days: 1,
      hours: 4,
      minutes: 0,
    });
  });

  it('returns days hours and minutes', () => {
    expect(computeTotalTimeSaved('90', 17)).toEqual({
      days: 1,
      hours: 1,
      minutes: 30,
    });
  });

  it('returns only days when exact multiple of 24 hours', () => {
    expect(computeTotalTimeSaved('60', 48)).toEqual({
      days: 2,
      hours: 0,
      minutes: 0,
    });
  });
});

describe('parseTimeSavedMinutes', () => {
  it('returns null when input is undefined', () => {
    expect(parseTimeSavedMinutes(undefined)).toBeNull();
  });

  it('returns null when input is empty string', () => {
    expect(parseTimeSavedMinutes('')).toBeNull();
  });

  it('returns null when input is non-numeric', () => {
    expect(parseTimeSavedMinutes('abc')).toBeNull();
  });

  it('returns null when input is zero', () => {
    expect(parseTimeSavedMinutes('0')).toBeNull();
  });

  it('returns null when input is negative', () => {
    expect(parseTimeSavedMinutes('-30')).toBeNull();
  });

  it('returns minutes only when under 60', () => {
    expect(parseTimeSavedMinutes('30')).toEqual({
      days: 0,
      hours: 0,
      minutes: 30,
    });
  });

  it('returns hours only when exact hours', () => {
    expect(parseTimeSavedMinutes('180')).toEqual({
      days: 0,
      hours: 3,
      minutes: 0,
    });
  });

  it('returns hours and minutes', () => {
    expect(parseTimeSavedMinutes('90')).toEqual({
      days: 0,
      hours: 1,
      minutes: 30,
    });
  });

  it('returns days and hours when over 24 hours', () => {
    expect(parseTimeSavedMinutes('1680')).toEqual({
      days: 1,
      hours: 4,
      minutes: 0,
    });
  });

  it('returns 1 minute for input of 1', () => {
    expect(parseTimeSavedMinutes('1')).toEqual({
      days: 0,
      hours: 0,
      minutes: 1,
    });
  });
});

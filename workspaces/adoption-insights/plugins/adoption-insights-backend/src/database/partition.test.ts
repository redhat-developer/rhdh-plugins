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
import { createPartition } from './partition';
import { Knex } from 'knex';

const mockRaw = jest.fn();
const knex = {
  schema: { raw: mockRaw },
} as unknown as Knex;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createPartition', () => {
  it('should create a partition without errors', async () => {
    mockRaw.mockResolvedValueOnce(undefined);

    await createPartition(knex, 2025, 5);

    expect(mockRaw).toHaveBeenCalledWith(
      expect.stringContaining(`CREATE TABLE IF NOT EXISTS events_2025_05`),
    );
  });

  it('should handle overlapping partition error and retry', async () => {
    const overlapError = new Error(
      'partition "events_2025_05" would overlap partition "events_2025_04"',
    );

    mockRaw
      .mockRejectedValueOnce(overlapError) // create fails
      .mockResolvedValueOnce(undefined) // drop overlap partition
      .mockResolvedValueOnce(undefined) // recreate dropped partition
      .mockResolvedValueOnce(undefined); // retry create current partition

    await createPartition(knex, 2025, 5);

    expect(mockRaw).toHaveBeenCalledWith(
      expect.stringContaining(`DROP TABLE IF EXISTS events_2025_04 CASCADE`),
    );
    expect(mockRaw).toHaveBeenCalledWith(
      expect.stringContaining(`CREATE TABLE IF NOT EXISTS events_2025_04`),
    );
    expect(mockRaw).toHaveBeenCalledWith(
      expect.stringContaining(`CREATE TABLE IF NOT EXISTS events_2025_05`),
    );
  });

  it('should handle max retry when recreating dropped partition', async () => {
    const overlapError = new Error(
      'partition "events_2025_05" would overlap partition "events_2025_04"',
    );

    mockRaw
      .mockRejectedValueOnce(overlapError) // create fails for events_2025_05
      .mockResolvedValueOnce(undefined) // drop overlap partition events_2025_04
      .mockRejectedValueOnce(overlapError) // create fails again for events_2025_04
      .mockResolvedValueOnce(undefined); // retry create current partition -  events_2025_05

    await expect(createPartition(knex, 2025, 5)).rejects.toThrow(
      'Exceeded max retries for partition 2025_4',
    );
  });

  it('should not retry for non-overlap errors', async () => {
    const otherError = new Error('some other SQL error');
    mockRaw.mockRejectedValueOnce(otherError);

    await expect(createPartition(knex, 2025, 6)).rejects.toThrow(
      'some other SQL error',
    );

    expect(mockRaw).toHaveBeenCalledTimes(1);
  });
});

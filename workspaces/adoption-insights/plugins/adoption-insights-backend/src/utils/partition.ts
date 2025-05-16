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
export const extractOverlappingPartition = (message: string): string => {
  const match = message.match(/would overlap partition "(.*?)"$/);
  return match?.[1] || '';
};

export const parsePartitionDate = (
  name: string,
): { year: number; month: number } => {
  const match = name.match(/events_(\d{4})_(\d{1,2})/);
  if (!match) throw new Error(`Cannot parse partition name: ${name}`);
  return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
};

export const isPartitionOverlapError = (error: unknown): boolean => {
  return (
    error !== null &&
    typeof (error as any).message === 'string' &&
    (error as any).message.includes('would overlap partition')
  );
};

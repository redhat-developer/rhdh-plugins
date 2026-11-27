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

type ScanAccumulateOptions<TItem, TResult> = {
  getValue: (item: TItem, result: TResult) => void;
  initialResult: TResult;
  context: string;
  fetchItemsLimit?: number;
};

export type ScanPagesOptions<TItem, TResult> = ScanAccumulateOptions<
  TItem,
  TResult
> & {
  fetchPage: (page: number, perPage: number) => Promise<TItem[]>;
  shouldContinue?: (items: TItem[], perPage: number) => boolean;
};

export type Cursor = string | null;

type ScanCursorPage<TItem> = {
  items: TItem[];
  nextCursor: Cursor;
  hasNextPage: boolean;
};

export type ScanByCursorOptions<TItem, TResult> = ScanAccumulateOptions<
  TItem,
  TResult
> & {
  fetchPage: (
    cursor: Cursor,
    pageSize: number,
  ) => Promise<ScanCursorPage<TItem>>;
};

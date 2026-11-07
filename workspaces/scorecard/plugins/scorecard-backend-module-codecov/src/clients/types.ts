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

export interface CodecovTotals {
  files: number;
  lines: number;
  hits: number;
  misses: number;
  partials: number;
  coverage: number;
  branches: number;
  methods: number;
  sessions: number;
  complexity: number;
  complexity_total: number;
  complexity_ratio: number;
  diff: number;
}

export interface CodecovAuthor {
  service: string;
  username: string;
  name: string;
}

export interface CodecovRepoResponse {
  name: string;
  private: boolean;
  updatestamp: string;
  author: CodecovAuthor;
  language: string;
  branch: string;
  active: boolean;
  activated: boolean;
  totals: CodecovTotals;
}

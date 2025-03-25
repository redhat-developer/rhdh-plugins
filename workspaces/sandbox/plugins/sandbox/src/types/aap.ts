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

export type AAPItem = {
  status: {
    conditions: StatusCondition[];
    URL: string;
    adminPasswordSecret: string;
    adminUser: string;
  };
  spec: {
    idle_aap: boolean;
  };
  metadata: {
    name: string;
    uuid: string;
    creationTimestamp: string;
  };
};

export type AAPData = {
  items: AAPItem[];
};

export type StatusCondition = {
  type: string;
  status: string;
  reason: string;
  message: string;
};

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

export type Status =
  | 'unknown'
  | 'new'
  | 'verify'
  | 'pending-approval'
  | 'provisioning'
  | 'ready';

export type SignupData = {
  name: string;
  compliantUsername: string;
  username: string;
  givenName: string;
  familyName: string;
  company: string;
  email?: string;
  userID?: string;
  accountID?: string;
  accountNumber?: string;
  status: SignUpStatusData;
  consoleURL?: string;
  proxyURL?: string;
  rhodsMemberURL?: string;
  cheDashboardURL?: string;
  apiEndpoint?: string;
  clusterName?: string;
  defaultUserNamespace?: string;
  startDate?: string;
  endDate?: string;
};

export type SignUpStatusData = {
  ready: boolean;
  reason: string;
  verificationRequired: boolean;
};

export type CommonResponse = {
  status: string;
  code: number;
  message: string;
  details: string;
};

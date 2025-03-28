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
import { Status, SignupData } from '../types';

export const signupDataToStatus = (signupData?: SignupData): Status => {
  let status: Status;
  if (!signupData) {
    status = 'new';
  } else if (signupData.status.ready) {
    status = 'ready';
  } else if (
    !signupData.status.ready &&
    signupData.status.verificationRequired
  ) {
    status = 'verify';
  } else if (
    !signupData.status.ready &&
    signupData.status.reason === 'Provisioning'
  ) {
    status = 'provisioning';
  } else {
    // unknown state
    status = 'pending-approval';
  }
  return status;
};

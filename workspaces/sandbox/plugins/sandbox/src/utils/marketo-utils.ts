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

import { SignupData } from '../types';
import { getCookie } from './cookie-utils';

/**
 * Marketo tracking data structure
 */
export interface MarketoTrackingData {
  C_FirstName: string;
  C_LastName: string;
  C_EmailAddress: string;
  C_Company: string;
  A_Timestamp: string;
  F_FormData_Source: string;
  A_OfferID: string;
  A_TacticID_External: string;
  A_TacticID_Internal: string;
  Status: string;
}

/**
 * Get current UTC timestamp in the format expected by Marketo
 * Format: YYYY/MM/DD HH:mm:ss
 */
const getMarketoTimestamp = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Send catalog click event to Marketo via Workato webhook
 * This function is non-blocking and will not throw errors
 *
 * @param userData - User signup data containing name, email, company
 * @param offerID - The offer ID (intcmp) for the product clicked
 * @param webhookURL - The Workato webhook URL from UI config
 */
export const trackMarketoEvent = async (
  userData: SignupData | undefined,
  offerID?: string,
  webhookURL?: string,
): Promise<void> => {
  // Skip if essential data is missing
  if (!userData || !userData.email || !webhookURL) {
    return;
  }

  try {
    // Read tactic IDs from cookies
    const tacticIdExternal = getCookie('rh_omni_tc') || '';
    const tacticIdInternal = getCookie('rh_omni_itc') || '';

    // Build Marketo tracking payload
    const payload: MarketoTrackingData = {
      C_FirstName: userData.givenName || '',
      C_LastName: userData.familyName || '',
      C_EmailAddress: userData.email || '',
      C_Company: userData.company || '',
      A_Timestamp: getMarketoTimestamp(),
      F_FormData_Source: 'sandbox-redhat-com-integration',
      A_OfferID: offerID || '',
      A_TacticID_External: tacticIdExternal,
      A_TacticID_Internal: tacticIdInternal,
      Status: 'Engaged',
    };

    // Send to Marketo webhook (non-blocking)
    await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silently fail - don't block user experience
    // eslint-disable-next-line no-console
    console.debug('Marketo tracking failed:', error);
  }
};

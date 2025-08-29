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

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalyticsBrowser } from '@segment/analytics-next';

// SHA1 hash function
const sha1 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export interface SegmentTrackingData {
  itemName: string;
  section: 'Catalog' | 'Activities' | 'Support' | 'Verification';
  href?: string;
  internalCampaign?: string;
  linkType?: 'cta' | 'default';
}

/**
 * Hook for managing Segment Analytics integration
 * @param writeKey - Segment write key for initialization
 * @param compliantUsername - User's compliant username (will be SHA1 hashed for userId)
 * @returns Object containing tracking function and initialization status
 */
export const useSegmentAnalytics = (
  writeKey?: string,
  compliantUsername?: string,
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const analyticsRef = useRef<AnalyticsBrowser | null>(null);

  // Initialize Segment Analytics when writeKey is available
  useEffect(() => {
    if (!writeKey) {
      return;
    }

    const initializeSegment = async () => {
      try {
        analyticsRef.current = AnalyticsBrowser.load({ writeKey });
        setIsInitialized(true);
        setInitializationError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setInitializationError(errorMessage);
        setIsInitialized(false);
      }
    };

    initializeSegment();
  }, [writeKey]);

  const trackClick = useCallback(
    async (data: SegmentTrackingData): Promise<void> => {
      if (!analyticsRef.current || !isInitialized) {
        return;
      }

      try {
        const trackingPayload = {
          category: `Developer Sandbox|${data.section}`,
          regions: `sandbox-${data.section.toLocaleLowerCase('en-US')}`,
          text: data.itemName,
          href: data.href,
          linkType: data.linkType || 'default',
          ...(data.internalCampaign && {
            internalCampaign: data.internalCampaign,
          }),
        };

        // Create userId from hashed compliantUsername if available
        let userId: string | undefined;
        if (compliantUsername) {
          userId = await sha1(compliantUsername);
        }

        // Track with properties and userId using same structure as Adobe EDDL
        if (userId) {
          analyticsRef.current.track(data.itemName, trackingPayload, {
            userId,
          });
        } else {
          analyticsRef.current.track(data.itemName, trackingPayload);
        }
      } catch (error) {
        // Don't throw - allow Adobe tracking to continue
      }
    },
    [isInitialized, compliantUsername],
  );

  return {
    trackClick,
    isInitialized,
    initializationError,
    isReady: isInitialized && analyticsRef.current !== null,
  };
};

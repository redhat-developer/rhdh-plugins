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
import { SignupData } from '../types';

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
 * @param user - Full signup user data for identify/group calls
 * @returns Object containing tracking function and initialization status
 */
export const useSegmentAnalytics = (writeKey?: string, user?: SignupData) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );
  const analyticsRef = useRef<AnalyticsBrowser | null>(null);
  const hasIdentifiedRef = useRef<boolean>(false);
  const hasGroupedRef = useRef<boolean>(false);
  const lastIdentifiedUserIdRef = useRef<string | undefined>(undefined);

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

  // Perform IDENTIFY and GROUP once per session per user
  useEffect(() => {
    if (!analyticsRef.current || !isInitialized) {
      return;
    }

    const currentUserId = user?.userID;

    // Reset flags if user changes
    if (currentUserId && lastIdentifiedUserIdRef.current !== currentUserId) {
      hasIdentifiedRef.current = false;
      hasGroupedRef.current = false;
    }

    if (currentUserId && !hasIdentifiedRef.current) {
      try {
        const traits: Record<string, any> = {
          // Only non-sensitive traits are allowed
          company: user?.company,
        };

        // Extract email domain if email is available
        if (user?.email) {
          const emailDomain = user.email.split('@')[1];
          if (emailDomain) {
            traits.email_domain = emailDomain;
          }
        }

        analyticsRef.current.identify(currentUserId, traits);
        hasIdentifiedRef.current = true;
        lastIdentifiedUserIdRef.current = currentUserId;
      } catch (e) {
        // ignore identify errors
      }
    }

    if (user?.accountID && !hasGroupedRef.current) {
      try {
        const groupTraits: Record<string, any> = {};
        if (user?.accountNumber) {
          groupTraits.ebs = user.accountNumber;
        }
        analyticsRef.current.group(user.accountID, groupTraits);
        hasGroupedRef.current = true;
      } catch (e) {
        // ignore group errors
      }
    }
  }, [isInitialized, user]);

  const trackClick = useCallback(
    async (data: SegmentTrackingData): Promise<void> => {
      if (!analyticsRef.current || !isInitialized) {
        return;
      }

      try {
        // Build event name: "What <past-tense-verb>"
        const verb = data.linkType === 'cta' ? 'launched' : 'clicked';
        const eventName = `${data.itemName} ${verb}`;

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

        analyticsRef.current.track(eventName, trackingPayload);
      } catch (error) {
        // Don't throw - allow Adobe tracking to continue
      }
    },
    [isInitialized],
  );

  return {
    trackClick,
    isInitialized,
    initializationError,
    isReady: isInitialized && analyticsRef.current !== null,
  };
};

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

import { useCallback } from 'react';
import { useSandboxContext } from '../hooks/useSandboxContext';
import { trackMarketoEvent } from './marketo-utils';

/**
 * Get Red Hat EDDL data attributes for tracking clicks (for non-CTA elements)
 * These attributes work with dpal.js for Adobe Analytics
 *
 * @param itemName - The text content to track (e.g., product name, article title)
 * @param section - The section type ('Catalog', 'Activities', 'Support', or 'Verification')
 * @returns Object with Red Hat EDDL data attributes
 */
export const getEddlDataAttributes = (
  itemName: string,
  section: 'Catalog' | 'Activities' | 'Support' | 'Verification' = 'Catalog',
) => {
  return {
    'data-analytics-category': `Developer Sandbox|${section}`,
    'data-analytics-text': itemName,
    'data-analytics-region': `sandbox-${section.toLocaleLowerCase('en-US')}`,
  };
};

/**
 * Push CTA event to Adobe Data Layer for manual tracking
 * This function should be called when a CTA element is clicked
 * Note: window.appEventData is managed by dpal.js
 *
 * @param itemName - The text content that was clicked
 * @param section - The section where the click occurred
 * @param href - The destination URL
 * @param internalCampaign - Optional internal campaign ID
 */
export const pushCtaEvent = (
  itemName: string,
  section: 'Catalog' | 'Activities' | 'Support' | 'Verification',
  href: string,
  internalCampaign?: string,
) => {
  if (typeof window !== 'undefined') {
    const eventData = {
      event: 'Master Link Clicked',
      linkInfo: {
        category: `Developer Sandbox|${section}`,
        regions: `sandbox-${section.toLocaleLowerCase('en-US')}`,
        text: itemName,
        href: href,
        linkType: 'cta',
        linkTypeName: 'cross property link',
        ...(internalCampaign && { internalCampaign }),
      },
    };

    // Ensure appEventData exists before pushing
    if (!(window as any).appEventData) {
      (window as any).appEventData = [];
    }

    // Push to the data layer managed by dpal.js
    (window as any).appEventData.push(eventData);
  }
};

/**
 * React hook for triple analytics tracking (Adobe EDDL + Segment + Marketo)
 * This hook returns a function that tracks events to:
 * - Adobe Analytics (via EDDL)
 * - Segment Analytics
 * - Marketo (for Catalog clicks only)
 */
export const useTrackAnalytics = () => {
  const { segmentTrackClick, userData, marketoWebhookURL } =
    useSandboxContext();

  return useCallback(
    async (
      itemName: string,
      section: 'Catalog' | 'Activities' | 'Support' | 'Verification',
      href: string,
      internalCampaign?: string,
      linkType: 'cta' | 'default' = 'default',
    ) => {
      // Adobe EDDL tracking for CTA events
      if (linkType === 'cta') {
        pushCtaEvent(itemName, section, href, internalCampaign);
      }

      // Segment tracking (if available from context)
      if (segmentTrackClick) {
        try {
          await segmentTrackClick({
            itemName,
            section,
            href,
            internalCampaign,
            linkType,
          });
        } catch (error) {
          // Segment tracking failed, continue without blocking user experience
        }
      }

      // Marketo tracking (Catalog clicks only)
      if (section === 'Catalog') {
        try {
          await trackMarketoEvent(
            userData,
            internalCampaign,
            marketoWebhookURL,
          );
        } catch (error) {
          // Marketo tracking failed, continue without blocking user experience
        }
      }
    },
    [segmentTrackClick, userData, marketoWebhookURL],
  );
};

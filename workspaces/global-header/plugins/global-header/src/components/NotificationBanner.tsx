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

import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';

import { MarkdownContent } from '@backstage/core-components';

import Alert from '@mui/material/Alert';

import { HeaderIcon } from './HeaderIcon/HeaderIcon';

/**
 * @public
 */
export type NotificationBannerDismiss = 'none' | 'session' | 'localstorage';

/**
 * @public
 */
export interface NotificationBannerProps {
  id?: string;
  title: string;
  markdown?: boolean;
  icon?: string;

  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  layout?: CSSProperties;

  dismiss?: NotificationBannerDismiss;
}

export const NotificationBanner = (props: NotificationBannerProps) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (props.dismiss === 'localstorage') {
      try {
        const dismissedString =
          localStorage.getItem('global-header/NotificationBanner') ?? '{}';
        const dismissedObject = JSON.parse(dismissedString);
        return dismissedObject[props.id ?? props.title] === 'dismissed';
      } catch (error) {
        // nothing
        return false;
      }
    } else {
      return false;
    }
  });

  const onClose = useMemo<(() => void) | undefined>(() => {
    if (!props.dismiss || props.dismiss === 'none') {
      return undefined;
    } else if (props.dismiss === 'session') {
      return () => setDismissed(true);
    } else if (props.dismiss === 'localstorage') {
      return () => {
        try {
          const dismissedString =
            localStorage.getItem('global-header/NotificationBanner') ?? '{}';
          const dismissedObject = JSON.parse(dismissedString);
          dismissedObject[props.id ?? props.title] = 'dismissed';
          localStorage.setItem(
            'global-header/NotificationBanner',
            JSON.stringify(dismissedObject),
          );
        } catch (error) {
          // nothing
        }
        setDismissed(true);
      };
    }
    // eslint-disable-next-line no-console
    console.warn(
      `Unsupported dismiss option "${props.dismiss}", currently supported "none", "session" or "localstorage"!`,
    );
    return undefined;
  }, [props.id, props.title, props.dismiss]);

  if (dismissed || !props.title) {
    return null;
  }

  return (
    <Alert
      color="warning"
      icon={props.icon ? <HeaderIcon icon={props.icon} /> : false}
      onClose={onClose}
      sx={{
        color: props.textColor,
        backgroundColor: props.backgroundColor,
        borderColor: props.borderColor,
        borderStyle: 'solid',
        borderWidth: 2,
        borderRadius: 0,
        justifyContent: 'center',
        textAlign: 'center',
        ...props.layout,
      }}
    >
      {props.markdown ? (
        <MarkdownContent content={props.title} dialect="gfm" />
      ) : (
        props.title
      )}
    </Alert>
  );
};

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

import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { SidebarPage } from '@backstage/core-components';
import {
  ApplicationDrawer,
  type AppDrawerContent,
  type AppHeaderData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import Box from '@mui/material/Box';

import { AppHeaders } from '../header/AppHeaders';

/**
 * Props for {@link AppLayout}.
 *
 * @public
 */
export interface AppLayoutProps {
  /** Headers contributed via `AppHeaderBlueprint`, rendered above everything else. */
  headers: AppHeaderData[];
  /** Drawers contributed via `AppDrawerContentBlueprint`, rendered next to the content. */
  drawers: AppDrawerContent[];
  /** The app navigation, usually the sidebar rendered by `app/nav`. */
  nav: ReactNode;
  /** The routed page content rendered by `app/routes`. */
  content: ReactNode;
}

/**
 * Returns the vertical offset of the layout in the document, so the layout
 * can fill exactly the viewport space left below anything an app root wrapper
 * renders above it (for example a sticky global header).
 */
function useDocumentOffsetTop(ref: RefObject<HTMLElement | null>) {
  const [offsetTop, setOffsetTop] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }
    const update = () => {
      const scrollTop = document.scrollingElement?.scrollTop ?? 0;
      const top = element.getBoundingClientRect().top + scrollTop;
      setOffsetTop(Math.max(0, Math.round(top)));
    };
    update();
    window.addEventListener('resize', update);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [ref]);

  return offsetTop;
}

/**
 * RHDH app layout. Replaces the Backstage default layout, which only renders
 * the sidebar and the content, with a fixed viewport shell:
 *
 * - All {@link AppHeaders} are stacked at the top, spanning the full width.
 * - Below them the sidebar, the page content and the app drawer sit side by
 *   side. The sidebar and the drawer panel are positioned relative to this
 *   row (not the viewport), so they start below the headers and never
 *   overlap them.
 * - The content scrolls on its own; the headers, the sidebar and the drawer
 *   stay in place.
 *
 * The shell fills the viewport below anything rendered above it by app root
 * wrappers, so it also composes with a sticky header outside the layout.
 *
 * @public
 */
export const AppLayout = ({
  headers,
  drawers,
  nav,
  content,
}: AppLayoutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const offsetTop = useDocumentOffsetTop(ref);

  return (
    <Box
      id="rhdh-app-layout"
      ref={ref}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: offsetTop ? `calc(100vh - ${offsetTop}px)` : '100vh',
        overflow: 'hidden',
      }}
    >
      <AppHeaders headers={headers} />
      <Box
        sx={{
          flex: '1 1 auto',
          minHeight: 0,
          position: 'relative',
          // Make this row the containing block of the fixed-position sidebar
          // and drawer panel so both are laid out side by side with the content
          // below the headers instead of relative to the viewport.
          contain: 'layout',
          // Column 1: the content wrapper rendered by ApplicationDrawer, which
          // shifts via margin-right when a drawer opens. Column 2: the docked
          // drawer root (zero width, the panel itself is positioned).
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gridTemplateRows: 'minmax(0, 1fr)',
        }}
      >
        <ApplicationDrawer contents={drawers}>
          <Box
            sx={{
              height: '100%',
              overflow: 'auto',
              // The RHDH theme sizes the sidebar page to the viewport; size it
              // to the space left below the headers instead.
              '& > [class*="BackstageSidebarPage-root"]': {
                height: '100%',
                minHeight: '100%',
                maxHeight: '100%',
              },
            }}
          >
            <SidebarPage>
              {nav}
              {content}
            </SidebarPage>
          </Box>
        </ApplicationDrawer>
      </Box>
    </Box>
  );
};

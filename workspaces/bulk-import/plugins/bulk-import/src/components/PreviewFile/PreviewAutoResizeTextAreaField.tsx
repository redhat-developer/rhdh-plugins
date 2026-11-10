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

import { ComponentProps, useCallback, useLayoutEffect, useRef } from 'react';

import { TextAreaField } from '@backstage/ui';

const syncTextAreaHeight = (root: HTMLElement | null) => {
  const textarea = root?.querySelector('textarea');
  if (!textarea) {
    return;
  }
  textarea.style.overflow = 'hidden';
  textarea.style.resize = 'none';
  textarea.style.height = '0px';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export const PreviewAutoResizeTextAreaField = (
  props: ComponentProps<typeof TextAreaField>,
) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { onChange, value, rows: _rows, ...rest } = props;

  const resize = useCallback(() => {
    syncTextAreaHeight(wrapperRef.current);
  }, []);

  useLayoutEffect(() => {
    const runResize = () => {
      resize();
      requestAnimationFrame(resize);
    };
    runResize();
    const root = wrapperRef.current;
    if (!root || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => runResize());
    observer.observe(root);
    const fieldRoot = root.closest('.bulk-import-floating-field');
    if (fieldRoot instanceof HTMLElement) {
      observer.observe(fieldRoot);
    }
    return () => observer.disconnect();
  }, [value, resize]);

  return (
    <div ref={wrapperRef} className="bulk-import-preview-auto-resize-textarea">
      <TextAreaField
        {...rest}
        value={value}
        rows={1}
        onChange={nextValue => {
          onChange?.(nextValue);
          requestAnimationFrame(resize);
        }}
        style={{ ...rest.style, flex: '0 0 auto' }}
      />
    </div>
  );
};

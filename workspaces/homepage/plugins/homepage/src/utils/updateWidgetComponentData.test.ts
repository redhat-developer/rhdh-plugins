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
  attachComponentData,
  getComponentData,
} from '@backstage/core-plugin-api';
import { createElement } from 'react';

import { updateWidgetComponentData } from './updateWidgetComponentData';

const Widget = () => createElement('div');

describe('updateWidgetComponentData', () => {
  it('does nothing when the component has no backstage data container', () => {
    const component = () => createElement('div');

    expect(() =>
      updateWidgetComponentData(component, 'title', 'Translated'),
    ).not.toThrow();
  });

  it('updates attached component metadata in place', () => {
    attachComponentData(Widget, 'title', 'Original title');
    attachComponentData(Widget, 'description', 'Original description');

    updateWidgetComponentData(Widget, 'title', 'Translated title');
    updateWidgetComponentData(Widget, 'description', undefined);

    expect(getComponentData({ type: Widget } as any, 'title')).toBe(
      'Translated title',
    );
    expect(getComponentData({ type: Widget } as any, 'description')).toBe(
      undefined,
    );
  });
});

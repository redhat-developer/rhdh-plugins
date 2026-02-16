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

import React from 'react';
import { renderInTestApp } from '@backstage/test-utils';
import { AnalyticsIcon } from './AnalyticsIcon';
import { AnalyticsIconOutlined } from './AnalyticsIconOutlined';
import { AnalyticsIconFilled } from './AnalyticsIconFilled';

describe('AnalyticsIcon', () => {
  it('should render the outlined version by default', async () => {
    const view = await renderInTestApp(<AnalyticsIcon />);

    expect(view.asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <svg
          aria-hidden="true"
          class="MuiSvgIcon-root"
          focusable="false"
          viewBox="0 -960 960 960"
        >
          <path
            d="M280-280h80v-200h-80v200Zm320 0h80v-400h-80v400Zm-160 0h80v-120h-80v120Zm0-200h80v-80h-80v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"
          />
        </svg>
      </DocumentFragment>
    `);
  });

  it('should render the outlined version when passed the outlined variant', async () => {
    const view = await renderInTestApp(<AnalyticsIconOutlined />);

    expect(view.asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <svg
          aria-hidden="true"
          class="MuiSvgIcon-root"
          focusable="false"
          variant="outlined"
          viewBox="0 -960 960 960"
        >
          <path
            d="M280-280h80v-200h-80v200Zm320 0h80v-400h-80v400Zm-160 0h80v-120h-80v120Zm0-200h80v-80h-80v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"
          />
        </svg>
      </DocumentFragment>
    `);
  });

  it('should render the filled version when passed the filled variant', async () => {
    const view = await renderInTestApp(<AnalyticsIconFilled />);

    expect(view.asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <svg
          aria-hidden="true"
          class="MuiSvgIcon-root"
          focusable="false"
          variant="filled"
          viewBox="0 -960 960 960"
        >
          <path
            d="M280-280h80v-200h-80v200Zm320 0h80v-400h-80v400Zm-160 0h80v-120h-80v120Zm0-200h80v-80h-80v80ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Z"
          />
        </svg>
      </DocumentFragment>
    `);
  });
});

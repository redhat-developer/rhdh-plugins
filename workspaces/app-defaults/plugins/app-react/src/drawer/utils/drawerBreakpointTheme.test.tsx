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

import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
// eslint-disable-next-line no-restricted-imports -- mirrors production v4 nest
import {
  createMuiTheme,
  ThemeProvider as ThemeProviderV4,
  useTheme as useThemeV4,
} from '@material-ui/core/styles';

import {
  DrawerBreakpointTheme,
  shiftBreakpointValues,
} from './drawerBreakpointTheme';

describe('shiftBreakpointValues', () => {
  it('leaves values unchanged when offset is 0', () => {
    const values = { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 };
    expect(shiftBreakpointValues(values, 0)).toBe(values);
  });

  it('adds offset to every breakpoint except xs', () => {
    expect(
      shiftBreakpointValues(
        { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
        500,
      ),
    ).toEqual({ xs: 0, sm: 1100, md: 1460, lg: 1780, xl: 2420 });
  });
});

describe('DrawerBreakpointTheme', () => {
  function V5BreakpointProbe() {
    const theme = useTheme();
    return (
      <>
        <span data-testid="v5-md">{theme.breakpoints.values.md}</span>
        <span data-testid="v5-md-up">{theme.breakpoints.up('md')}</span>
      </>
    );
  }

  function V4BreakpointProbe() {
    const theme = useThemeV4();
    return (
      <>
        <span data-testid="v4-md">{theme.breakpoints.values.md}</span>
        <span data-testid="v4-md-up">{theme.breakpoints.up('md')}</span>
      </>
    );
  }

  it('raises nested v4 and v5 breakpoint values and media queries by the drawer offset', () => {
    const themeV5 = createTheme({
      breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    });
    const themeV4 = createMuiTheme({
      breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 } },
    });

    render(
      <ThemeProvider theme={themeV5}>
        <ThemeProviderV4 theme={themeV4}>
          <DrawerBreakpointTheme offset={500}>
            <V5BreakpointProbe />
            <V4BreakpointProbe />
          </DrawerBreakpointTheme>
        </ThemeProviderV4>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('v5-md')).toHaveTextContent('1400');
    expect(screen.getByTestId('v5-md-up')).toHaveTextContent(
      '@media (min-width:1400px)',
    );
    expect(screen.getByTestId('v4-md')).toHaveTextContent('1460');
    expect(screen.getByTestId('v4-md-up')).toHaveTextContent(
      '@media (min-width:1460px)',
    );
  });

  it('passes through themes when the drawer is closed', () => {
    const themeV5 = createTheme({
      breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    });
    const themeV4 = createMuiTheme({
      breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 } },
    });

    render(
      <ThemeProvider theme={themeV5}>
        <ThemeProviderV4 theme={themeV4}>
          <DrawerBreakpointTheme offset={0}>
            <V5BreakpointProbe />
            <V4BreakpointProbe />
          </DrawerBreakpointTheme>
        </ThemeProviderV4>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('v5-md')).toHaveTextContent('900');
    expect(screen.getByTestId('v5-md-up')).toHaveTextContent(
      '@media (min-width:900px)',
    );
    expect(screen.getByTestId('v4-md')).toHaveTextContent('960');
    expect(screen.getByTestId('v4-md-up')).toHaveTextContent(
      '@media (min-width:960px)',
    );
  });
});

/*
 * Copyright 2024 The Backstage Authors
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
import { type UnifiedThemeOptions } from '@backstage/theme';
import { ThemeConfig, ThemeConfigOptions, RHDHThemePalette } from '../types';

export type Component = {
  defaultProps?: unknown;
  styleOverrides?: unknown;
  variants?: unknown;
};

export type Components = UnifiedThemeOptions['components'] & {
  BackstageHeaderTabs?: Component;
  BackstageSidebar?: Component;
  BackstageSidebarItem?: Component;
  BackstagePage?: Component;
  BackstageContent?: Component;
  BackstageContentHeader?: Component;
  BackstageHeader?: Component;
  BackstageItemCardHeader?: Component;
  BackstageTableToolbar?: Component;
  CatalogReactUserListPicker?: Component;
  PrivateTabIndicator?: Component;
};

export const createComponents = (themeConfig: ThemeConfig): Components => {
  // Short hands to ensure that the code doesn't break if one of the properties is not defined.

  const options = themeConfig.options ?? ({} as ThemeConfigOptions);
  const disableRipple = options?.rippleEffect !== 'on'; // by default ripple effect is disabled

  const palette = themeConfig.palette ?? {};

  const general = palette.rhdh?.general || ({} as RHDHThemePalette['general']);
  const rhdhPrimary =
    palette.rhdh?.primary || ({} as RHDHThemePalette['primary']);
  const rhdhSecondary =
    palette.rhdh?.secondary || ({} as RHDHThemePalette['secondary']);

  const components: Components = {};
  if (options.components === 'backstage' || options.components === 'mui') {
    return components;
  }

  //
  // MUI components
  //

  // MUI base
  if (options.buttons !== 'mui') {
    components.MuiTypography = {
      styleOverrides: {
        button: {
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    };
  }

  // MUI container
  if (options.paper !== 'mui') {
    const elevationStyle = {
      boxShadow: 'none',
      outline: `1px solid ${general.paperBorderColor}`,
      '& > hr[class|="MuiDivider-root"]': {
        backgroundColor: general.paperBorderColor,
      },
    };
    const noElevationStyle = {
      boxShadow: 'none',
      outline: 'none',
    };

    components.MuiPaper = {
      styleOverrides: {
        root: {
          // This works for all MUI v5 components, but in MUI v4
          boxShadow: 'none',
          outline: `1px solid ${general.paperBorderColor}`,
          // Required only for MUI v5 components because a gradient `backgroundImage`
          // overrides the default background.paper color otherwise.
          backgroundImage: general.paperBackgroundImage,
          // hide the first child element which is a divider with MuiDivider-root classname in MuiPaper
          '& > hr:first-child[class|="MuiDivider-root"]': {
            height: 0,
          },
        },
        elevation0: noElevationStyle,
      },
    };
    components.MuiPopover = {
      styleOverrides: {
        paper: {
          // Box shadow from PatternFly 5 (--pf-v5-global--BoxShadow--sm)
          boxShadow: general.popoverBoxShadow,
          // `Popover` has no outline by default, but since we're adding it to the `Paper`
          // components, this ensures that the `Popover` doesn't has a shadow and an outline.
          outline: 0,
        },
      },
    };

    // Required for MUI v4, not MUI v5
    const elevations = Array.from(
      { length: 24 },
      (_, i) => `elevation${i + 1}`,
    ) as 'elevation1'[];
    elevations.forEach(elevation => {
      components.MuiPaper!.styleOverrides![elevation] = elevationStyle;
    });
  }

  // MUI buttons
  // Don't disableRipple for MuiButtonBase as it will affect all the buttons
  // and we need to ensure that the buttons have a right touch and focus styling.
  if (options.buttons !== 'mui') {
    components.MuiButton = {
      defaultProps: {
        disableRipple,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          border: '0',
          borderRadius: '3px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            border: '0',
            boxShadow: 'none',
          },
          '&:-webkit-any-link:focus-visible': {
            outlineOffset: '0',
          },
        },
        containedPrimary: {
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 1px ${rhdhPrimary.focusVisibleBorder}`,
            outline: `${rhdhPrimary.focusVisibleBorder} solid 1px`,
          },
          '&:disabled': {
            color: general.disabled,
            backgroundColor: general.disabledBackground,
          },
        },
        containedSecondary: {
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 1px ${rhdhSecondary.focusVisibleBorder}`,
            outline: `${rhdhSecondary.focusVisibleBorder} solid 1px`,
          },
          '&:disabled': {
            color: general.disabled,
            backgroundColor: general.disabledBackground,
          },
        },
        outlined: {
          border: `1px solid color-mix(in srgb, currentColor 50%, transparent)`,
          '&:hover': {
            backgroundColor: 'transparent',
            border: `1px solid`,
          },
        },
        outlinedPrimary: {
          '&:hover': {
            backgroundColor: 'transparent',
          },
        },
        outlinedSecondary: {
          '&:hover': {
            backgroundColor: 'transparent',
          },
        },
        text: {
          '&:focus-visible': {
            boxShadow: `inset 0 0 0 2px ${rhdhPrimary.main}`,
            outline: `${rhdhPrimary.focusVisibleBorder} solid 1px`,
          },
        },
      },
    };
    components.MuiToggleButton = {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    };
    components.MuiIconButton = {
      styleOverrides: {
        root: {
          '&:disabled': {
            color: general.disabled,
          },
        },
      },
    };
    components.MuiLink = {
      styleOverrides: {
        underlineHover: {
          '&:hover': {
            textDecoration: 'none',
          },
        },
      },
    };
  }

  // MUI input fields
  if (options.inputs !== 'mui') {
    components.MuiInputBase = {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: general.disabled,
            opacity: 1,
          },
        },
      },
    };
    components.MuiOutlinedInput = {
      styleOverrides: {
        input: {
          '&:autofill': {
            boxShadow: `0 0 0 100px ${general.formControlBackgroundColor} inset`,
            borderRadius: 'unset',
          },
        },
      },
    };
  }

  if (options.inputs !== 'mui') {
    components.MuiCheckbox = {
      defaultProps: {
        color: 'primary',
      },
    };
  }

  // MUI accordion
  if (options.accordions !== 'mui') {
    components.MuiAccordion = {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
        rounded: {
          '&:first-child': {
            borderTopLeftRadius: '0',
            borderTopRightRadius: '0',
          },
          '&:last-child': {
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
          },
        },
      },
    };
  }

  // MUI cards
  if (options.cards !== 'mui') {
    components.MuiCard = {
      styleOverrides: {
        root: {
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: general.cardBackgroundColor,
        },
      },
    };
    components.MuiCardHeader = {
      styleOverrides: {
        content: {
          '& > span > nav span': {
            textTransform: 'unset',
            letterSpacing: 'normal',
            fountweight: 'normal',
          },
        },
        title: {
          fontSize: '1.125rem',
        },
        action: {
          '& > a > span > svg': {
            fontSize: '1.125rem',
          },
          '& > a[class*="MuiIconButton-root"]:hover': {
            backgroundColor: 'transparent',
          },
        },
      },
    };
    components.MuiCardContent = {
      styleOverrides: {
        root: {
          flexGrow: '1',
          backgroundColor: general.cardBackgroundColor,
          '& > div > div > h2[class*="MuiTypography-h2-"]': {
            textTransform: 'unset',
            opacity: '40%',
          },
          '& > div > div > div[class*="MuiChip-sizeSmall"]': {
            backgroundColor: 'transparent',
            borderRadius: '8px',
            outline: `1px solid ${general.disabled}`,
          },
          '& > div[class*="Mui-expanded"]': {
            margin: 'auto',
          },
          '& > div[class*="MuiAccordion-root"]:before': {
            height: 0,
          },
          // Override the default line-clamp from 10 to 2 for the Software template catalog
          '& > div[class*="MuiGrid-root-"][class*="MuiGrid-container-"][class*="MuiGrid-spacing-xs-2-"] > div[class*="MuiGrid-root-"][class*="MuiGrid-item-"][class*="MuiGrid-grid-xs-12-"] > div[class*="MuiBox-root-"]':
            {
              '-webkit-line-clamp': '2',
            },
        },
      },
    };
  }

  // MUI table
  if (options.tables !== 'mui') {
    components.MuiTable = {
      styleOverrides: {
        root: {
          backgroundColor: general.tableBackgroundColor,
        },
      },
    };
    components.MuiTableRow = {
      styleOverrides: {
        root: {
          backgroundColor: general.tableBackgroundColor,
          '&:not([class*="MuiTableRow-footer"]):hover': {
            backgroundColor: `${general.tableRowHover} !important`,
          },
          '& > th[class*="MuiTableCell-head"]': {
            backgroundColor: general.tableBackgroundColor,
          },
        },
      },
    };
    components.MuiTableCell = {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&[class*="BackstageTableHeader-header"]': {
            borderTop: 'unset',
            borderBottom: `1px solid ${general.tableBorderColor}`,
          },
        },
        // @ts-expect-error: MUI types are not up to date
        head: {
          textTransform: 'unset !important',
          color: `${general.tableColumnTitleColor} !important`,
          '& > span[class*="MuiTableSortLabel-active"]': {
            color: `${rhdhPrimary.main} !important`,
          },
          '& > span > svg[class*="MuiTableSortLabel-icon"]': {
            color: 'inherit !important',
          },
        },
        body: {
          color: general.tableTitleColor,
          '& > div[class*="MuiChip-sizeSmall"]': {
            margin: '2px',
          },
        },
      },
    };
    components.MuiTableFooter = {
      styleOverrides: {
        root: {
          '& > tr > td': {
            borderBottom: 'none',
          },
        },
      },
    };
  }

  // MUI toolbar
  if (options.toolbars !== 'mui') {
    components.MuiToolbar = {
      styleOverrides: {
        regular: {
          '& > div > h2[class*="MuiTypography-h5"]': {
            fontSize: '1.25rem',
            color: general.tableTitleColor,
          },
        },
      },
    };
  }

  // MUI dialogs
  if (options.dialogs !== 'mui') {
    components.MuiDialogContent = {
      styleOverrides: {
        root: {
          '& > div': {
            backgroundColor: general.cardBackgroundColor,
          },
        },
      },
    };
  }

  // MUI tabs
  if (options.tabs !== 'mui') {
    components.MuiTabs = {
      defaultProps: {
        indicatorColor: 'primary',
      },
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${general.tabsBottomBorderColor}`,
          padding: '0 1.5rem',
        },
        vertical: {
          '& > div > div > button[class*="v5"]': {
            alignItems: 'baseline',
            textAlign: 'left',
          },
          '& > div > div > button > span': {
            alignItems: 'baseline',
            textAlign: 'left',
          },
          borderBottom: `none`,
          borderLeft: `1px solid ${general.tabsBottomBorderColor}`,
          padding: 0,
        },
        flexContainerVertical: {
          '& > button:hover': {
            boxShadow: `2px 0 ${general.tabsBottomBorderColor} inset`,
          },
        },
        indicator: {
          left: 0,
        },
      },
    };
    components.MuiTab = {
      defaultProps: {
        disableRipple,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'initial !important',
          '&:disabled': {
            backgroundColor: general.tabsDisabledBackgroundColor,
          },
          '&:hover': {
            boxShadow: `0 -2px ${general.tabsBottomBorderColor} inset`,
          },
        },
      },
    };
  }

  //
  // Backstage
  //
  if (options.tabs !== 'mui') {
    components.BackstageHeaderTabs = {
      styleOverrides: {
        tabsWrapper: {
          paddingLeft: '0',
          backgroundColor: general.mainSectionBackgroundColor,
        },
        defaultTab: {
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: '500',
          color: general.disabled,
          padding: '0.5rem 1rem',
          '&:hover': {
            boxShadow: `0 -3px ${general.tabsBottomBorderColor} inset`,
          },
        },
        tabRoot: {
          '&:hover': {
            backgroundColor: 'unset',
          },
          '&:not(.Mui-selected):hover': {
            color: general.disabled,
          },
        },
      },
    };
  }

  if (options.sidebars !== 'mui') {
    components.BackstageSidebar = {
      styleOverrides: {
        drawer: {
          backgroundColor:
            general.sidebarBackgroundColor ?? general.sideBarBackgroundColor,
          '& a[class*="BackstageSidebarItem-selected-"]': {
            backgroundColor: general.sidebarItemSelectedBackgroundColor,
          },
        },
      },
    };
    components.BackstageSidebarItem = {
      styleOverrides: {
        label: {
          '&[class*="MuiTypography-subtitle2"]': {
            fontWeight: '500',
          },
        },
      },
    };
  }

  if (options.pages !== 'mui') {
    components.BackstagePage = {
      styleOverrides: {
        root: {
          backgroundColor: general.mainSectionBackgroundColor,
        },
      },
    };
    components.BackstageContent = {
      styleOverrides: {
        root: {
          backgroundColor: general.mainSectionBackgroundColor,
        },
      },
    };
    components.BackstageContentHeader = {
      styleOverrides: {
        leftItemsBox: {
          '& > h2[class*="BackstageContentHeader-title-"][class*="MuiTypography-h4-"]':
            {
              fontWeight: 'bold',
              fontSize: '1.75rem',
            },
        },
      },
    };
  }

  if (options.headers !== 'mui') {
    components.BackstageHeader = {
      styleOverrides: {
        header: {
          boxShadow: 'none',
          borderBottom: `1px solid ${general.headerBottomBorderColor}`,
        },
        title: {
          fontWeight: 'bold',
          '&[class*="MuiTypography-h1-"]': {
            fontWeight: 'bold',
            fontSize: '2rem',
          },
        },
      },
    };
    components.BackstageItemCardHeader = {
      styleOverrides: {
        root: {
          // This is required to increase the css specificity, to OVERRIDE the styles from
          // BackstageItemCardHeader (https://github.com/backstage/backstage/blob/master/packages/core-components/src/layout/ItemCard/ItemCardHeader.tsx)
          // These are applied with a CSS class as well.

          // This variant is used when running the Storybook locally (dev mode) and in Backstage/RHDH!
          '&[class*="MuiBox-root-"]': {
            color: palette.rhdh?.cards?.headerTextColor,
            backgroundColor: palette.rhdh?.cards?.headerBackgroundColor,
            backgroundImage: palette.rhdh?.cards?.headerBackgroundImage,
            borderBottom: `1px solid ${general.cardBorderColor}`,
          },
          // This variant is used when building a static Storybook (`storybook:build`)
          '&[class~="MuiBox-root"]': {
            color: palette.rhdh?.cards?.headerTextColor,
            backgroundColor: palette.rhdh?.cards?.headerBackgroundColor,
            backgroundImage: palette.rhdh?.cards?.headerBackgroundImage,
            borderBottom: `1px solid ${general.cardBorderColor}`,
          },
          '& > h3[class*="MuiTypography-subtitle2-"] > div > div:first-child': {
            textTransform: 'capitalize',
          },
        },
      },
    };
  }

  if (options.toolbars !== 'mui') {
    components.BackstageTableToolbar = {
      styleOverrides: {
        root: {
          '& h2': {
            fontWeight: 'bold',
          },
        },
        title: {
          '& > h2': {
            fontWeight: 'bold',
          },
        },
      },
    };
  }

  //
  // Others
  //
  components.CatalogReactUserListPicker = {
    styleOverrides: {
      root: {
        borderRadius: '4px',
      },
      title: {
        textTransform: 'none',
      },
    },
  };

  if (options.tabs !== 'mui') {
    components.PrivateTabIndicator = {
      styleOverrides: {
        root: {
          height: '3px',
        },
        vertical: {
          width: '3px',
        },
      },
    };
  }

  return components;
};

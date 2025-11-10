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
  type UnifiedThemeOptions,
  defaultComponentThemes as backstageComponents,
} from '@backstage/theme';
import { type CSSObject } from '@mui/material/styles';

import { ThemeConfig, ThemeConfigOptions, RHDHThemePalette } from '../types';
import { redHatFontFaces, redHatFonts } from '../fonts';

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
  RHDHPageWithoutFixHeight?: Component;
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
  components.MuiCssBaseline = {
    styleOverrides: theme => {
      const backstageOverrides =
        backstageComponents!.MuiCssBaseline!.styleOverrides!;
      const backstageStyles =
        typeof backstageOverrides === 'function'
          ? (backstageOverrides(theme) as CSSObject)
          : (backstageOverrides as CSSObject);

      return {
        ...backstageStyles,
        '@font-face': redHatFontFaces,
        body: {
          ...(backstageStyles.body as CSSObject),
          fontFamily: redHatFonts.text,
        },
        'h1, h2, h3, h4, h5, h6': {
          fontFamily: redHatFonts.heading,
        },
        'pre, code': {
          fontFamily: redHatFonts.monospace,
        },
        "[class*='BackstagePage-root-'] > [class*='MuiToolbar-root']": {
          backgroundColor: theme.palette.background.paper,
        },
      };
    },
  };

  // MUI base
  if (options.buttons !== 'mui') {
    components.MuiTypography = {
      styleOverrides: {
        root: {
          fontFamily: redHatFonts.text,
          fontWeight: 'normal',
          letterSpacing: '0.01em',
          // This is required to override the default MUI styles
          // that set the `font-weight` to `500` for the `h1` element.
          '&.MuiTypography-h1': {
            fontWeight: 'normal',
          },
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
        rounded: {
          '& > :last-child': {
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
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

  // MUI AppBar
  if (options.appBar !== 'mui') {
    components.MuiAppBar = {
      styleOverrides: {
        root: {
          backgroundColor: general.appBarBackgroundColor,
          backgroundImage: general.appBarBackgroundImage,
          outline: 'none',
        },
      },
    };
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
          borderRadius: '3px',
          fontWeight: 'normal',
        },
        contained: {
          border: '0',
          borderRadius: '99em',
          boxShadow: 'none',
          '&:hover, &:focus-visible': {
            border: '0',
            boxShadow: 'none',
          },
          '&:-webkit-any-link:focus-visible': {
            outlineOffset: '0',
          },
        },
        containedPrimary: {
          borderRadius: '99em',
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
          borderRadius: '99em',
          border: `1px solid color-mix(in srgb, currentColor 50%, transparent)`,
          '&:hover, &:focus-visible': {
            backgroundColor: 'transparent',
            border: `1px solid`,
          },
          '&:disabled': {
            color: general.disabled,
            backgroudColor: general.disabledBackground,
            border: `1px solid ${general.disabledBackground}`,
          },
        },
        outlinedPrimary: {
          '&:hover, &:focus-visible': {
            backgroundColor: 'transparent',
          },
        },
        outlinedSecondary: {
          '&:hover, &:focus-visible': {
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
          '&:hover, &:focus-visible': {
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

  if (options.checkbox !== 'mui') {
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
          borderRadius: '16px',
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
          borderBottom: `1px solid ${general.paperBorderColor}`,
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
          borderLeft: `1px solid ${general.paperBorderColor}`,
          padding: 0,
          "& span[class*='MuiTabs-indicator']": {
            width: '3px',
          },
        },
        indicator: {
          left: 0,
          height: '3px',
        },
      },
    };
    components.MuiTab = {
      defaultProps: {
        disableRipple,
      },
      styleOverrides: {
        root: {
          fontWeight: '400',
          minWidth: 'initial !important',
          padding: '0.25em 1em',
          position: 'relative',
          textTransform: 'none',
          zIndex: 1,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: '0.75em',
            left: '0.5em',
            right: '0.5em',
            bottom: '0.75em',
            borderRadius: '4px',
            zIndex: -1,
          },
          '&.Mui-selected': {
            color: `${palette.text?.primary} !important`,
          },
          '&[class*="v5"]': {
            lineHeight: 1.75,
          },
          '&:hover, &:focus-visible': {
            backgroundColor: 'transparent !important',
            '&:before': {
              backgroundColor: general.tabsLinkHoverBackgroundColor,
            },
          },
          '&:disabled': {
            color: general.disabled,
            '&:before': {
              backgroundColor: general.disabledBackground,
            },
          },
        },
      },
    };

    // MUI Breadcrumbs
    if (options.breadcrumbs !== 'mui') {
      components.MuiBreadcrumbs = {
        defaultProps: {
          separator: '>',
        },
        styleOverrides: {
          separator: {
            fontWeight: 'bold',
          },
          root: {
            fontWeight: '400',
          },
          li: {
            fontSize: '0.875rem !important',
            fontStyle: 'normal !important',
          },
        },
      };
    }
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
          fontSize: '0.875rem',
          fontWeight: '400',
          color: 'unset',
          padding: '0.25em 1em',
        },
      },
    };
  }

  if (options.sidebars !== 'mui') {
    components.BackstageSidebar = {
      styleOverrides: {
        drawer: {
          gap: '0.25rem',
          borderRight: `0.5rem solid ${general.sidebarBackgroundColor}`,
          paddingBottom: '1.5rem',
          backgroundColor: general.sidebarBackgroundColor,
          '& hr': {
            backgroundColor: general.sidebarDividerColor,
          },
        },
      },
    };
    components.BackstageSidebarItem = {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          width: 'calc(100% - 0.5rem) !important',
          marginLeft: '0.5rem !important',
          textDecorationLine: 'none',
          '&:hover, &:focus-visible': {
            backgroundColor: general.sidebarItemSelectedBackgroundColor,
          },
        },
        label: {
          '&[class*="MuiTypography-subtitle2"]': {
            fontWeight: 'normal',
          },
        },
        selected: {
          backgroundColor: general.sidebarItemSelectedBackgroundColor,
        },
      },
    };
    components.MuiBottomNavigation = {
      styleOverrides: {
        root: {
          backgroundColor: `${general.sidebarBackgroundColor} !important`,
          borderColor: `${general.sidebarBackgroundColor} !important`,
        },
      },
    };
    components.MuiBottomNavigationAction = {
      defaultProps: {
        disableRipple,
      },
      styleOverrides: {
        root: {
          color: `${palette.text?.primary} !important`,
          backgroundColor: `${general.sidebarBackgroundColor} !important`,
          borderRadius: '6px',
          borderTop: '3px solid transparent !important', // default mui selected styling
          paddingTop: '6px !important', // default mui selected styling
          marginTop: '-1px !important', // default mui selected styling
          '&:hover, &:focus-visible': {
            backgroundColor: `${general.sidebarItemSelectedBackgroundColor} !important`,
          },
        },
        selected: {
          backgroundColor: `${general.sidebarItemSelectedBackgroundColor} !important`,
          color: `${palette.text?.primary} !important`,
        },
      },
    };
    components.MuiDrawer = {
      styleOverrides: {
        root: {
          // undocumented Backstage makeStyles
          "& [class*='makeStyles-overlay-']": {
            backgroundColor: `${general.sidebarBackgroundColor} !important`,
          },
          '& hr': {
            backgroundColor: general.sidebarDividerColor,
          },
        },
      },
    };
  }

  if (options.pages !== 'mui') {
    components.RHDHPageWithoutFixHeight = {
      styleOverrides: {
        root: {
          // Cancel out the spacing produced by the page inset border when
          // the global header is present in the above-sidebar position.
          '@media (min-width: 600px)': {
            '#rhdh-above-sidebar-header-container:has(*) ~ #rhdh-sidebar-layout':
              {
                "& main, & [class*='MuiLinearProgress-root']": {
                  marginTop: '0 !important',
                },
              },
          },
        },
        sidebarLayout: {
          // Cancel out the spacing produced by the page inset border when
          // the global header is present in the above-main-content position.
          '@media (min-width: 600px)': {
            '#rhdh-above-main-content-header-container:has(*)': {
              "& ~ main, & ~ [class*='MuiLinearProgress-root']": {
                marginTop: '0 !important',
              },
            },
          },
        },
      },
    };
    components.BackstageSidebarPage = {
      styleOverrides: {
        root: {
          // Controls the page inset as in PF6 -- only in desktop view
          '@media (min-width: 600px)': {
            backgroundColor: general.sidebarBackgroundColor,
            // Prevents the main content from scrolling weird
            overflowY: 'auto',
            // Cancel out the spacing produced by the page inset border when
            // the sidebar is present
            '& nav': {
              "& ~ main, & ~ [class*='MuiLinearProgress-root']": {
                marginLeft: '0 !important',
              },
            },
            "& > [class*='MuiLinearProgress-root'], & > main": {
              // clip-path clips the scrollbar properly in Chrome compared to
              // border-radius. 1rem is the hardcoded border-radius of the page content.
              clipPath: 'rect(0 100% 100% 0 round 1rem)',
              // Emulate the PatternFly 6 page inset using a margin
              margin: general.pageInset,
              // Prevent overflow in the main container due to the margin
              maxHeight: `calc(100vh - 2 * ${general.pageInset})`,
            },
            // The Backstage suspense is an MUI LinearProgress that is not wrapped by
            // a `main`. We need to give it 100vh height to fill the page for the page
            // inset to look right.
            "& > [class*='MuiLinearProgress-root']": {
              backgroundColor: general.mainSectionBackgroundColor,
              height: '100vh',
              "& > [class*='MuiLinearProgress-']": {
                height: '0.5rem !important',
              },
            },
          },
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
        },
        title: {
          '&[class*="MuiTypography-h1-"]': {
            fontWeight: '500',
            fontSize: '1.5rem',
          },
        },
        subtitle: {
          '&[class*="BackstageHeader-subtitle-"]': {
            fontWeight: 'normal',
            fontSize: '0.875rem',
            opacity: 1,
          },
        },
        breadcrumb: {
          marginBottom: '0.5rem',
        },
      },
    };
    components.BreadcrumbsCurrentPage = {
      styleOverrides: {
        root: {
          '& p': {
            fontStyle: 'normal',
            fontSize: 'inherit',
          },
        },
      },
    };
    components.BackstageBreadcrumbsStyledBox = {
      styleOverrides: {
        root: {
          textDecoration: 'underline !important',
          color: palette.rhdh?.primary.main,
          '&:hover': {
            color: `color-mix(in srgb, ${palette.rhdh?.primary.main} 50%, ${palette.text?.primary})`,
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
          zIndex: 1,
        },
        vertical: {
          width: '3px',
        },
      },
    };
  }

  return components;
};

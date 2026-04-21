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

import { makeStyles } from '@material-ui/core/styles';

/**
 * Single shared style hook for the DCM plugin.
 *
 * Covers three areas:
 *   1. Tab-list pages (Environments, Service specs) and their Add/Edit dialogs.
 *   2. Detail pages (EnvironmentDetails, ServiceSpecDetails) and their sub-tabs.
 *   3. Utility classes used across both areas.
 */
export const useDcmStyles = makeStyles(theme => ({
  // ─── Utility ────────────────────────────────────────────────────────────────

  underlineLink: {
    textDecoration: 'underline',
  },

  cardTitle: {
    fontSize: '23px',
  },

  /** Name/ID cell — prevents TruncatedText from overflowing a flex table column. */
  nameCellBox: {
    minWidth: 0,
  },

  /** Chip used for API version badges — clamps long version strings. */
  apiVersionChip: {
    maxWidth: 140,
  },

  truncatedText: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'default',
  },

  // ─── Shared table infrastructure (tab-list pages AND detail sub-tabs) ───────

  /** Outer wrapper that corrects table cell/pagination colours. */
  root: {
    color: theme.palette.text.primary,
    paddingLeft: theme.spacing(3),
    '& .MuiTableCell-head': {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightBold,
    },
    '& .MuiTableCell-body': {
      color: theme.palette.text.primary,
    },
    '& .MuiTablePagination-root': {
      color: theme.palette.text.primary,
    },
    '& .MuiTablePagination-select, & .MuiTablePagination-selectIcon': {
      color: theme.palette.text.primary,
    },
    '& .MuiIconButton-root': {
      color: theme.palette.text.secondary,
      '&:hover': {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.action.hover,
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
  },

  /** Filter / search TextField inside an InfoCard header action. */
  searchInput: {
    '& .MuiInput-underline:before': {
      borderBottomColor: theme.palette.text.secondary,
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: theme.palette.primary.main,
    },
    '& .MuiInputAdornment-root': {
      color: theme.palette.text.secondary,
    },
    '& .MuiIconButton-root': {
      color: theme.palette.text.secondary,
      padding: theme.spacing(0.5),
    },
  },

  /** InfoCard `action` slot wrapper that holds the search field. */
  cardHeaderAction: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },

  /** Inner content box of an InfoCard that wraps a Table. */
  cardContent: {
    padding: theme.spacing(3),
    '& .MuiTable-root': {
      marginTop: theme.spacing(2),
    },
    '& .MuiTableCell-root': {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      paddingLeft: theme.spacing(3),
      paddingRight: theme.spacing(3),
    },
  },

  // ─── Tab-list page layout ────────────────────────────────────────────────────

  toolbarRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing(2),
  },

  /** InfoCard surface for the main tab list tables (environments, service specs). */
  dataCard: {
    '& .MuiCardHeader-root': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
    '& .MuiCardContent-root': {
      paddingTop: theme.spacing(2),
    },
    '& .MuiDivider-root': {
      display: 'none',
    },
    '& hr': {
      display: 'none',
    },
    '& > div:first-of-type': {
      borderBottom: 'none',
    },
    '& [class*="cardHeader"], & [class*="CardHeader"]': {
      borderBottom: 'none',
    },
    '& .MuiTableContainer-root': {
      boxShadow: 'none',
      border: 'none',
    },
    '& .MuiPaper-root': {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-elevation1': {
      boxShadow: 'none',
    },
    '& .MuiPaper-elevation2': {
      boxShadow: 'none',
      outline: 'none',
      border: 'none',
    },
    '& [class*="MuiPaper-elevation2"]': {
      boxShadow: 'none',
      outline: 'none',
      border: 'none',
    },
    '& table': {
      border: 'none',
    },
  },

  // ─── Add / Edit dialog ───────────────────────────────────────────────────────

  dialogTitle: {
    padding: theme.spacing(2, 3),
  },

  dialogTitleText: {
    fontWeight: 700,
  },

  dialogTitleCloseBtn: {
    marginRight: -theme.spacing(1),
  },

  registerFormTypeField: {
    marginTop: theme.spacing(2),
  },

  dialogContent: {
    paddingTop: theme.spacing(1),
    '& .MuiTextField-root': {
      marginBottom: theme.spacing(5),
    },
    '& .MuiFormControl-root': {
      marginBottom: theme.spacing(5),
    },
    '& .MuiFormHelperText-root': {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(3),
    },
    '& .MuiInputBase-root': {
      minHeight: 48,
    },
    '& .MuiOutlinedInput-input': {
      padding: theme.spacing(1.5, 2),
    },
  },

  dialogErrorBanner: {
    marginTop: theme.spacing(2),
  },

  dialogActions: {
    justifyContent: 'flex-start',
    padding: theme.spacing(2, 3),
    '& .MuiButton-root': {
      minHeight: 42,
      padding: theme.spacing(1.25, 2.5),
    },
  },

  /**
   * Service spec Create/Edit — compliance block only (content uses same
   * `dialogContent` as Register environment for top/bottom + field spacing).
   */
  serviceSpecComplianceSection: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },

  serviceSpecComplianceTitle: {
    marginBottom: theme.spacing(1.5),
    fontSize: theme.typography.pxToRem(13),
    fontWeight: 400,
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
  },

  serviceSpecCheckboxGroup: {
    '& .MuiFormControlLabel-root': {
      marginBottom: theme.spacing(0.75),
      marginLeft: 0,
      marginRight: 0,
      alignItems: 'center',
    },
    '& .MuiFormControlLabel-root:last-child': {
      marginBottom: 0,
    },
  },

  quotaRow: {
    display: 'flex',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '& > *': {
      flex: 1,
    },
    '& > *:first-child': {
      marginRight: theme.spacing(2),
    },
  },

  // ─── Detail page layout ──────────────────────────────────────────────────────

  breadcrumb: {
    marginBottom: theme.spacing(1),
    fontSize: '10px',
    '& .MuiBreadcrumbs-separator': {
      marginLeft: theme.spacing(0.5),
      marginRight: theme.spacing(0.5),
      fontSize: '10px',
    },
    '& a, & .MuiTypography-root, & .MuiTypography-body2': {
      fontSize: '10px',
    },
  },

  pageTitle: {
    fontWeight: 700 as const,
    marginBottom: theme.spacing(2),
  },

  /** InfoCard surface for the Overview section on a details page. */
  overviewCard: {
    '& .MuiCardHeader-root': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
    '& hr': { display: 'none' },
    '& .MuiPaper-root': {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
      backgroundColor: theme.palette.background.paper,
    },
  },

  overviewGrid: {
    paddingTop: theme.spacing(0.5),
  },

  overviewCardTitle: {
    fontSize: '23px',
    fontWeight: 700 as const,
  },

  /** Small external-link icon rendered inline beside a URL. */
  inlineExternalIcon: {
    fontSize: 14,
    verticalAlign: 'middle',
    marginLeft: 4,
  },

  overviewLink: {
    color: theme.palette.primary.main,
    fontSize: 'inherit',
  },

  envChip: {
    marginRight: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    height: 24,
    fontSize: theme.typography.pxToRem(12),
  },

  tagChip: {
    marginRight: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    height: 24,
    fontSize: theme.typography.pxToRem(12),
  },

  yamlCard: {
    '& pre': {
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    },
  },

  /** InfoCard surface for entity/history tables on a details page. */
  tableCard: {
    '& .MuiCardHeader-root': {
      borderBottom: 'none',
      paddingBottom: 0,
    },
    '& .MuiCardContent-root': {
      paddingTop: theme.spacing(2),
    },
    '& hr': { display: 'none' },
    '& .MuiTableContainer-root': {
      boxShadow: 'none',
      border: 'none',
    },
    '& .MuiPaper-root': {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: 'transparent',
    },
    '& .MuiPaper-elevation2': {
      boxShadow: 'none',
      outline: 'none',
      border: 'none',
    },
    '& table': { border: 'none' },
  },
}));

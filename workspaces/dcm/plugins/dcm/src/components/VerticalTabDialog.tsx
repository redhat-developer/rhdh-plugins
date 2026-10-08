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
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MuiAlert from '@material-ui/lab/Alert';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  dialogPaper: {
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  leftNav: {
    width: 200,
    flexShrink: 0,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowY: 'auto',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  tab: {
    minWidth: 0,
    width: '100%',
    position: 'relative' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'left',
    textTransform: 'none',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    minHeight: 48,
    fontSize: theme.typography.pxToRem(13),
    fontWeight: 500,
    /**
     * Custom left indicator that is exactly the same height as the hover
     * background (the tab element itself).
     */
    '&.Mui-selected::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderRadius: '0 2px 2px 0',
      backgroundColor: theme.palette.primary.main,
    },
  },
  tabPanel: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(3),
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  footerRight: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  errorBanner: {
    marginBottom: theme.spacing(2),
  },
}));

export type VerticalTabItem = {
  /** Stable React key. Falls back to `label` when omitted. */
  key?: string;
  label: string;
  content: React.ReactNode;
};

export type VerticalTabDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title: string;
  tabs: VerticalTabItem[];
  activeTab: number;
  onTabChange: (index: number) => void;
  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;
  disabled?: boolean;
  error?: string | null;
  maxWidth?: React.ComponentProps<typeof Dialog>['maxWidth'];
  /**
   * Called when the "Next" button is clicked.
   * Return `true` to allow advancing to the next tab; `false` to stay (e.g.
   * the parent marks the tab as "attempted" so errors become visible).
   */
  onBeforeNext?: (currentTab: number) => boolean;
}>;

/**
 * A Dialog with a vertical left-hand tab navigation and a scrollable content
 * area on the right. Shared by the Catalog Item and Instance wizards.
 *
 * Footer shows Back / Next on intermediate tabs and the submit button only on
 * the last tab, so the user moves through each step before committing.
 */
export function VerticalTabDialog({
  open,
  onClose,
  title,
  tabs,
  activeTab,
  onTabChange,
  submitLabel,
  onSubmit,
  submitting = false,
  disabled = false,
  error,
  maxWidth = 'md',
  onBeforeNext,
}: VerticalTabDialogProps) {
  const classes = useStyles();
  const { t } = useTranslation();

  const isFirstTab = activeTab === 0;
  const isLastTab = activeTab === tabs.length - 1;

  const handleNext = () => {
    if (isLastTab) return;
    if (onBeforeNext) {
      if (onBeforeNext(activeTab)) {
        onTabChange(activeTab + 1);
      }
      // if false: parent has triggered error display — stay on current tab
    } else {
      onTabChange(activeTab + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstTab) {
      onTabChange(activeTab - 1);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{ className: classes.dialogPaper }}
    >
      {/* Header */}
      <Box className={classes.header}>
        <Typography variant="h6">{title}</Typography>
        <IconButton
          size="small"
          aria-label={t('common.close')}
          onClick={onClose}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body: left nav + content panel */}
      <Box className={classes.body}>
        <Box className={classes.leftNav}>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(_e, v) => onTabChange(v)}
            indicatorColor="primary"
            textColor="primary"
            // The built-in indicator is hidden because its height is set via
            // inline JS and can drift from the tab's visible area. A custom
            // ::before pseudo-element on the selected tab acts as the indicator.
            TabIndicatorProps={{ style: { display: 'none' } }}
          >
            {tabs.map(tab => (
              <Tab
                key={tab.key ?? tab.label}
                label={tab.label}
                className={classes.tab}
              />
            ))}
          </Tabs>
        </Box>

        <Box className={classes.tabPanel}>
          <Collapse in={Boolean(error)} className={classes.errorBanner}>
            <MuiAlert severity="error" variant="outlined">
              {error}
            </MuiAlert>
          </Collapse>
          {tabs[activeTab]?.content}
        </Box>
      </Box>

      {/* Footer: Back | Cancel · Next / Submit */}
      <Box className={classes.footer}>
        {/* Left: Back button (hidden on first tab) */}
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={isFirstTab || submitting}
        >
          {t('common.back')}
        </Button>

        {/* Right: Cancel + Next / Submit */}
        <Box className={classes.footerRight}>
          <Button
            variant="outlined"
            color="primary"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>

          {isLastTab ? (
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmit}
              disabled={submitting || disabled}
              startIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {submitting ? t('common.saving') : submitLabel}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={submitting}
              endIcon={<ArrowForwardIcon />}
            >
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

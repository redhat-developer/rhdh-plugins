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
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MarkdownContent } from '@backstage/core-components';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { FieldHelpContent } from '../utils/resolveFieldHelp';

const CLOSE_DELAY_MS = 200;
/** Vertical gap between the "?" and the help paper (matches prototype). */
const HELP_OFFSET_PX = 12;

export type FieldHelpProps = {
  content: FieldHelpContent;
  /** Used for the accessible name of the help control. */
  fieldLabel?: string;
};

/**
 * Shared on-demand field help: "?" beside the label, Paper above on hover.
 * Uses theme Paper (not inverse Tooltip) so light/dark match the prototype.
 */
export const FieldHelp = ({ content, fieldLabel }: FieldHelpProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = Boolean(anchorEl);
  const popoverId = useId();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  const handleOpen = useCallback(
    (element: HTMLElement) => {
      clearCloseTimer();
      setAnchorEl(element);
    },
    [clearCloseTimer],
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setAnchorEl(null);
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const ariaLabel = fieldLabel
    ? `More information about ${fieldLabel}`
    : 'More information';

  const linkLabel = content.link?.label?.trim();
  const linkUrl = content.link?.url?.trim();

  return (
    <>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        aria-describedby={open ? popoverId : undefined}
        data-testid="field-help-button"
        onMouseEnter={event => handleOpen(event.currentTarget)}
        onMouseLeave={scheduleClose}
        onFocus={event => handleOpen(event.currentTarget)}
        onBlur={scheduleClose}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          if (open) {
            setAnchorEl(null);
          } else {
            handleOpen(event.currentTarget);
          }
        }}
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
      <Popper
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        placement="top"
        modifiers={[
          {
            name: 'offset',
            options: { offset: [0, HELP_OFFSET_PX] },
          },
        ]}
        sx={{ zIndex: theme => theme.zIndex.tooltip }}
      >
        <Paper
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          sx={{ p: 2, maxWidth: 360 }}
        >
          <Stack spacing={0} data-testid="field-help-popover">
            {content.title ? (
              <Typography variant="subtitle2" component="div" fontWeight="bold">
                {content.title}
              </Typography>
            ) : null}
            <Box>
              <MarkdownContent content={content.body} />
            </Box>
            {linkUrl && linkLabel ? (
              <Link
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                data-testid="field-help-link"
                onClick={event => event.stopPropagation()}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                {linkLabel}
                <OpenInNewIcon fontSize="inherit" aria-hidden />
              </Link>
            ) : null}
          </Stack>
        </Paper>
      </Popper>
    </>
  );
};

/**
 * Label row with optional help icon (for inline use, e.g. checkbox labels).
 */
export const FieldLabelWithHelp = ({
  label,
  help,
  required,
}: {
  label: ReactNode;
  help?: FieldHelpContent;
  required?: boolean;
}) => {
  if (!help) {
    return (
      <>
        {label}
        {required ? ' *' : null}
      </>
    );
  }

  return (
    <Stack component="span" direction="row" alignItems="center" spacing={0.5}>
      <Typography component="span" variant="body2">
        {label}
        {required ? ' *' : null}
      </Typography>
      <FieldHelp
        content={help}
        fieldLabel={typeof label === 'string' ? label : undefined}
      />
    </Stack>
  );
};

/**
 * Places the field label and "?" above the control (matches design).
 * When help is missing, renders children unchanged so floating labels stay as-is.
 */
export const FieldWithHelpLayout = ({
  label,
  help,
  required,
  htmlFor,
  children,
}: {
  label: string;
  help?: FieldHelpContent;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) => {
  if (!help) {
    return <>{children}</>;
  }

  return (
    <Box width="100%">
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ mb: 0.75 }}
      >
        <Typography component="label" htmlFor={htmlFor} variant="body2">
          {label}
          {required ? ' *' : null}
        </Typography>
        <FieldHelp content={help} fieldLabel={label} />
      </Stack>
      {children}
    </Box>
  );
};

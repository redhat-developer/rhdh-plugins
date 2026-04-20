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

import { Tooltip, Typography } from '@material-ui/core';
import { useDcmStyles } from './dcmStyles';

type TypographyVariant = React.ComponentProps<typeof Typography>['variant'];

type TruncatedTextProps = Readonly<{
  /** The full text to display (and show in the tooltip). */
  text: string | undefined | null;
  /** CSS max-width applied to the text container. */
  maxWidth: number | string;
  /** MUI Typography variant. */
  variant: TypographyVariant;
  /** MUI color token, e.g. "textSecondary". */
  color?: string;
  /** When true, renders the text in semi-bold (font-weight 600). */
  bold: boolean;
  /** Node rendered when `text` is empty, null, or undefined. Use {@link DcmEmptyCell} for the standard dash placeholder. */
  fallback: React.ReactNode;
}>;

/** Standard empty-cell placeholder — a dim "—" dash rendered in caption style. */
export function DcmEmptyCell() {
  return (
    <Typography variant="caption" color="textSecondary">
      —
    </Typography>
  );
}

/**
 * Renders text truncated with an ellipsis when it overflows `maxWidth`, and
 * shows the full value in a MUI Tooltip on hover.
 *
 * Use this inside table column `render` functions for any free-form text that
 * can grow unbounded (names, endpoints, descriptions, paths, IDs, …).
 */
export function TruncatedText({
  text,
  maxWidth,
  variant,
  color,
  bold,
  fallback,
}: TruncatedTextProps) {
  const classes = useDcmStyles();

  if (!text) return <>{fallback}</>;

  return (
    <Tooltip title={text} placement="top-start" enterDelay={400}>
      <Typography
        variant={variant}
        color={color as React.ComponentProps<typeof Typography>['color']}
        className={classes.truncatedText}
        style={{ maxWidth, fontWeight: bold ? 600 : undefined }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

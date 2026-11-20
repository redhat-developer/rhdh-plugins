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

import { isValidElement, type ReactNode } from 'react';

import { InfoCard } from '@backstage/core-components';
import {
  ButtonIcon,
  Flex,
  List,
  ListRow,
  Skeleton,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiInformationLine,
  RiSubtractLine,
} from '@remixicon/react';

import styles from './PopularContentListCard.module.css';
import { PopularContentItem } from './types';

export type PopularContentListCardProps = {
  title: string;
  items: PopularContentItem[];
  loading?: boolean;
  error?: Error;
  /** When true, show a soft permission/empty message instead of an error panel. */
  permissionDenied?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  permissionDeniedMessage?: string;
  /** Optional trailing content under the list (e.g. "View all"). */
  footer?: ReactNode;
  /**
   * When true, show each row's 1-based rank in front of the title and omit
   * leading icons (rank replaces the icon slot, matching Top Plugins).
   */
  showRank?: boolean;
  /** Optional tooltip text shown on the right side of the card header. */
  titleTooltip?: string;
  /** Label appended after locale-formatted visit counts. Default: `visits`. */
  visitsLabel?: string;
};

function parseTrendPercentage(
  value: string | number | undefined,
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function TrendMetric({
  trendPercentage,
}: {
  trendPercentage: string | number | undefined;
}) {
  const parsed = parseTrendPercentage(trendPercentage);
  if (parsed === null) {
    return null;
  }

  const rounded = Math.round(parsed);
  let color: 'secondary' | 'danger' | 'success' = 'success';
  let Icon = RiArrowUpLine;
  if (rounded === 0) {
    color = 'secondary';
    Icon = RiSubtractLine;
  } else if (rounded < 0) {
    color = 'danger';
    Icon = RiArrowDownLine;
  }
  const signed = `${rounded > 0 ? '+' : ''}${rounded}%`;

  return (
    <Text
      variant="body-small"
      weight="bold"
      color={color}
      as="span"
      aria-label={`Trend ${signed}`}
      style={{ flexShrink: 0 }}
    >
      <Flex align="center" gap="1" style={{ display: 'inline-flex' }}>
        <Icon size={14} aria-hidden />
        <Text variant="body-small" weight="bold" color={color} as="span">
          {signed}
        </Text>
      </Flex>
    </Text>
  );
}

function VisitMetric({
  visitCount,
  visitsLabel,
}: {
  visitCount: number | undefined;
  visitsLabel: string;
}) {
  if (typeof visitCount !== 'number' || !Number.isFinite(visitCount)) {
    return null;
  }

  return (
    <Text
      variant="body-x-small"
      color="secondary"
      style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
    >
      {`${visitCount.toLocaleString()} ${visitsLabel}`}
    </Text>
  );
}

function RowMetrics({
  item,
  visitsLabel,
}: {
  item: PopularContentItem;
  visitsLabel: string;
}) {
  if (item.visitCount === undefined && item.trendPercentage === undefined) {
    return null;
  }

  return (
    <Flex direction="column" align="end" gap="0">
      <TrendMetric trendPercentage={item.trendPercentage} />
      <VisitMetric visitCount={item.visitCount} visitsLabel={visitsLabel} />
    </Flex>
  );
}

/**
 * Shared list-card shell for Popular Content homepage widgets.
 * Empty and error states keep the homepage loadable (card still renders).
 */
export function PopularContentListCard({
  title,
  items,
  loading = false,
  error,
  permissionDenied = false,
  emptyMessage = 'No popular content to show yet.',
  errorMessage = 'Unable to load popular content right now.',
  permissionDeniedMessage = 'You do not have permission to view adoption insights data.',
  footer,
  showRank = false,
  titleTooltip,
  visitsLabel = 'visits',
}: PopularContentListCardProps) {
  // Match InfoCard header horizontal padding so row text aligns with the
  // title while borderBottom can still span the full card width (noPadding).
  const contentInlinePadding = '16px';
  const statusStyle = {
    padding: `8px ${contentInlinePadding} 16px`,
  } as const;

  let body: ReactNode;

  if (loading) {
    body = (
      <Flex
        direction="column"
        gap="3"
        aria-busy="true"
        aria-label="Loading"
        style={statusStyle}
      >
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="90%" />
        <Skeleton height="20px" width="80%" />
      </Flex>
    );
  } else if (permissionDenied) {
    body = (
      <Text
        variant="body-small"
        color="secondary"
        role="status"
        style={statusStyle}
      >
        {permissionDeniedMessage}
      </Text>
    );
  } else if (error) {
    body = (
      <Text
        variant="body-small"
        color="secondary"
        role="alert"
        style={statusStyle}
      >
        {errorMessage}
      </Text>
    );
  } else if (items.length === 0) {
    body = (
      <Text
        variant="body-small"
        color="secondary"
        role="status"
        style={statusStyle}
      >
        {emptyMessage}
      </Text>
    );
  } else {
    body = (
      // Collapse default List gap so borderBottom sits flush between rows.
      // Use --bui-border-1 (subtle separator); --bui-border was renamed away.
      <List aria-label={title} selectionMode="none" style={{ gap: 0 }}>
        {items.map((item, index) => {
          const rank = index + 1;
          const isLast = index === items.length - 1;
          const rowStyle = {
            borderRadius: 0,
            paddingBlock: 'var(--bui-space-3)', // 12px — match prototype row padding
            paddingInline: contentInlinePadding,
            ...(isLast
              ? undefined
              : { borderBottom: '1px solid var(--bui-border-1)' }),
          };
          // Whole-row navigation via ListRow href (GridListItem + BUI router).
          // Avoid nested title links so the row behaves like a single <li><a>.
          const titleContent = showRank ? (
            <Text variant="body-small" weight="bold" as="span">
              {item.title}
            </Text>
          ) : (
            item.title
          );

          // Rank replaces the leading icon. Keep it vertically centered with
          // the title+subtitle block (not top-aligned with the title alone).
          // ListRow's icon slot is a 32×32 neutral box — avoid that for ranks.
          if (showRank) {
            return (
              <ListRow
                key={item.id}
                id={item.id}
                textValue={item.title}
                href={item.href}
                className={styles.row}
                style={rowStyle}
                customActions={
                  <RowMetrics item={item} visitsLabel={visitsLabel} />
                }
              >
                <Flex align="center" gap="3">
                  <Text
                    variant="body-small"
                    color="secondary"
                    weight="bold"
                    as="span"
                    style={{ flexShrink: 0, lineHeight: 1 }}
                  >
                    {rank}
                  </Text>
                  <Flex direction="column" gap="0">
                    {titleContent}
                    {item.subtitle ? (
                      <Text variant="body-x-small" color="secondary" as="span">
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </Flex>
                </Flex>
              </ListRow>
            );
          }

          const leadingIcon =
            item.icon ??
            (item.iconUrl ? (
              <img
                src={item.iconUrl}
                alt=""
                width={16}
                height={16}
                style={{ display: 'block' }}
              />
            ) : undefined);

          return (
            <ListRow
              key={item.id}
              id={item.id}
              textValue={item.title}
              href={item.href}
              description={item.subtitle}
              icon={isValidElement(leadingIcon) ? leadingIcon : undefined}
              className={styles.row}
              style={rowStyle}
              customActions={
                <RowMetrics item={item} visitsLabel={visitsLabel} />
              }
            >
              {titleContent}
            </ListRow>
          );
        })}
      </List>
    );
  }

  // InfoCard (MUI paper) matches other NFS homepage widgets. @backstage/ui Card
  // uses bg="neutral" (e.g. --bui-bg-neutral-1), which reads as a different
  // surface in dark mode next to theme.palette.background.paper.
  //
  // Put the info control in the title row (not CardHeader `action`). MUI's
  // action slot uses marginTop:-4 / marginRight:-8, so top/right insets never
  // match. Inside the title, both edges use the same header padding.
  const titleNode = titleTooltip ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
      }}
    >
      <span>{title}</span>
      <TooltipTrigger delay={300}>
        <ButtonIcon
          aria-label={titleTooltip}
          icon={<RiInformationLine size={16} />}
          size="small"
          variant="tertiary"
        />
        <Tooltip>{titleTooltip}</Tooltip>
      </TooltipTrigger>
    </div>
  ) : (
    title
  );

  return (
    <InfoCard
      title={titleNode}
      titleTypographyProps={{
        // Drop MUI h5 default margin-bottom so the header sits tight above rows.
        ...(titleTooltip ? { component: 'div' as const } : undefined),
        style: {
          marginBottom: 0,
          ...(titleTooltip ? { width: '100%' } : undefined),
        },
      }}
      // Prototype has no header divider; row borders are the only separators.
      divider={false}
      // Drop CardContent padding so row borderBottom can span full card width;
      // horizontal inset is applied on each row / status message instead.
      noPadding
    >
      {body}
      {footer ? (
        <div style={{ padding: `0 ${contentInlinePadding} 16px` }}>
          {footer}
        </div>
      ) : null}
    </InfoCard>
  );
}

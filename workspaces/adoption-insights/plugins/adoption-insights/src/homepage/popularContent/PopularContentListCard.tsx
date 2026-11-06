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

import type { ReactNode } from 'react';

import {
  ButtonIcon,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Link,
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
  /** When true, prefix each row with its 1-based display rank. */
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
      {`${visitCount.toLocaleString('en-US')} ${visitsLabel}`}
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
  let body: ReactNode;

  if (loading) {
    body = (
      <Flex
        direction="column"
        gap="3"
        aria-busy="true"
        aria-label="Loading"
        style={{ padding: '8px 0' }}
      >
        <Skeleton height="20px" width="100%" />
        <Skeleton height="20px" width="90%" />
        <Skeleton height="20px" width="80%" />
      </Flex>
    );
  } else if (permissionDenied) {
    body = (
      <Text variant="body-small" color="secondary" role="status">
        {permissionDeniedMessage}
      </Text>
    );
  } else if (error) {
    body = (
      <Text variant="body-small" color="secondary" role="alert">
        {errorMessage}
      </Text>
    );
  } else if (items.length === 0) {
    body = (
      <Text variant="body-small" color="secondary" role="status">
        {emptyMessage}
      </Text>
    );
  } else {
    body = (
      <List aria-label={title} selectionMode="none">
        {items.map((item, index) => {
          const rank = index + 1;
          const titleNode = showRank ? (
            <Flex align="center" gap="2">
              <Text
                variant="body-small"
                color="secondary"
                weight="bold"
                as="span"
              >
                {rank}
              </Text>
              <Text variant="body-small" weight="bold" as="span">
                {item.title}
              </Text>
            </Flex>
          ) : (
            item.title
          );

          return (
            <ListRow
              key={item.id}
              id={item.id}
              textValue={item.title}
              description={item.subtitle}
              customActions={
                <RowMetrics item={item} visitsLabel={visitsLabel} />
              }
            >
              {item.href ? (
                <Link href={item.href} weight="bold">
                  {titleNode}
                </Link>
              ) : (
                titleNode
              )}
            </ListRow>
          );
        })}
      </List>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Flex
          justify="between"
          align="center"
          gap="2"
          style={{ width: '100%' }}
        >
          <Text variant="title-x-small" weight="bold">
            {title}
          </Text>
          {titleTooltip ? (
            <TooltipTrigger delay={300}>
              <ButtonIcon
                aria-label={titleTooltip}
                icon={<RiInformationLine size={16} />}
                size="small"
                variant="tertiary"
              />
              <Tooltip>{titleTooltip}</Tooltip>
            </TooltipTrigger>
          ) : null}
        </Flex>
      </CardHeader>
      <CardBody>{body}</CardBody>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

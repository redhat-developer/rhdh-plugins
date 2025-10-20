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
import Typography from '@material-ui/core/Typography';

// Currency symbol mapping (should match the one in OpenShiftPage.tsx)
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'CA$',
  CHF: 'CHF',
  CNY: 'CN¥',
  INR: '₹',
  MXN: '$',
  NZD: 'NZ$',
  SEK: 'SEK',
  SGD: 'SGD',
  HKD: 'HK$',
  TWD: 'NT$',
  THB: '฿',
  RUB: '₽',
  BRL: 'R$',
  ZAR: 'ZAR',
  PLN: 'zł',
  KRW: '₩',
  TRY: '₺',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  VND: '₫',
  HUF: 'Ft',
  CZK: 'Kč',
  NOK: 'NOK',
  DKK: 'DKK',
  NGN: '₦',
};

const formatCurrency = (value: number, currencyCode: string): string => {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

type PageHeaderProps = {
  totalCost: number;
  month: string;
  endDate: string;
  currencyCode: string;
  customStyle?: React.CSSProperties;
};

/** @public */
export function PageHeader(props: PageHeaderProps) {
  const { totalCost, month, endDate, currencyCode, customStyle = {} } = props;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        ...customStyle,
      }}
    >
      <Typography variant="h1" style={{ fontWeight: 'bold', margin: 0 }}>
        OpenShift
      </Typography>
      <div style={{ textAlign: 'right' }}>
        <Typography variant="h3" style={{ fontWeight: 'bold', margin: 0 }}>
          {formatCurrency(totalCost, currencyCode)}
        </Typography>
        <Typography variant="body1" style={{ color: '#666', marginTop: '4px' }}>
          {`${month} 1-${endDate}`}
        </Typography>
      </div>
    </div>
  );
}

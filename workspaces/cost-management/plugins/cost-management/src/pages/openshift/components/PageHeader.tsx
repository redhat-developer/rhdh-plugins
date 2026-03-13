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
import { CURRENCY_SYMBOLS } from '../../../constants/currencies';

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

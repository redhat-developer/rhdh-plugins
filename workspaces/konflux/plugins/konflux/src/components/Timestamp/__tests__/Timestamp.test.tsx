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

import { renderInTestApp } from '@backstage/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { Timestamp } from '../Timestamp';
import * as dateTime from '../datetime';

jest.mock('../datetime', () => ({
  isValid: jest.fn(),
  fromNow: jest.fn(),
  dateTimeFormatter: {
    format: jest.fn(),
  },
  utcDateTimeFormatter: {
    format: jest.fn(),
  },
  maxClockSkewMS: -60000,
}));

const mockDateTime = dateTime as jest.Mocked<typeof dateTime>;
const mockDateTimeFormatter = mockDateTime.dateTimeFormatter
  .format as jest.MockedFunction<typeof dateTime.dateTimeFormatter.format>;
const mockUtcDateTimeFormatter = mockDateTime.utcDateTimeFormatter
  .format as jest.MockedFunction<typeof dateTime.utcDateTimeFormatter.format>;

// Helper to query by data-test attribute since component uses data-test not data-testid
const getByTest = (testValue: string) => {
  return document.querySelector(`[data-test="${testValue}"]`);
};

describe('Timestamp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateTime.isValid.mockReturnValue(true);
    mockDateTime.fromNow.mockReturnValue('2 minutes ago');
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');
    mockUtcDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM UTC');
  });

  it('should render timestamp with tooltip for valid date string', async () => {
    const timestamp = '2021-04-23T16:33:00Z';
    const mockDate = new Date(timestamp);
    // Mock to return formatted date (older date scenario)
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');

    await renderInTestApp(<Timestamp timestamp={timestamp} />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent('Apr 23, 2021, 4:33 PM');
    });

    expect(mockDateTime.isValid).toHaveBeenCalledWith(mockDate);
  });

  it('should render timestamp with Unix timestamp when isUnix is true', async () => {
    const unixTimestamp = 1619197980; // Unix timestamp in seconds
    const mockDate = new Date(unixTimestamp * 1000);
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');

    await renderInTestApp(<Timestamp timestamp={unixTimestamp} isUnix />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
    });

    expect(mockDateTime.isValid).toHaveBeenCalledWith(mockDate);
  });

  it('should render "-" when timestamp is null', async () => {
    await renderInTestApp(<Timestamp timestamp={null as any} />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    expect(getByTest('timestamp')).not.toBeInTheDocument();
  });

  it('should render "-" when timestamp is undefined', async () => {
    await renderInTestApp(<Timestamp timestamp={undefined as any} />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    expect(getByTest('timestamp')).not.toBeInTheDocument();
  });

  it('should render "-" when timestamp is empty string', async () => {
    await renderInTestApp(<Timestamp timestamp="" />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    expect(getByTest('timestamp')).not.toBeInTheDocument();
  });

  it('should render "-" when date is invalid', async () => {
    const invalidTimestamp = 'invalid-date';
    // isValid is called twice: once in timestampFor and once in the component
    mockDateTime.isValid.mockReturnValue(false);

    await renderInTestApp(<Timestamp timestamp={invalidTimestamp} />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    // isValid is called with an invalid date (NaN), check that it was called with an invalid date
    expect(mockDateTime.isValid).toHaveBeenCalled();
    expect(mockDateTime.isValid.mock.calls[0][0]).toBeInstanceOf(Date);
    expect(Number.isNaN(mockDateTime.isValid.mock.calls[0][0].getTime())).toBe(
      true,
    );
    expect(getByTest('timestamp')).not.toBeInTheDocument();
  });

  it('should render simple mode without tooltip', async () => {
    const timestamp = '2021-04-23T16:33:00Z';
    const mockDate = new Date(timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - mockDate.getTime();
    if (timeDiff > mockDateTime.maxClockSkewMS && timeDiff < 630000) {
      mockDateTime.fromNow.mockReturnValue('2 minutes ago');
    } else {
      mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');
    }

    await renderInTestApp(<Timestamp timestamp={timestamp} simple />);

    await waitFor(() => {
      const relativeTime = screen.queryByText('2 minutes ago');
      const formattedDate = screen.queryByText('Apr 23, 2021, 4:33 PM');
      expect(relativeTime || formattedDate).toBeInTheDocument();
    });

    expect(getByTest('timestamp')).not.toBeInTheDocument();
    expect(mockDateTime.isValid).toHaveBeenCalledWith(mockDate);
  });

  it('should render with custom className', async () => {
    const timestamp = '2021-04-23T16:33:00Z';
    const className = 'custom-class';
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');

    await renderInTestApp(
      <Timestamp timestamp={timestamp} className={className} />,
    );

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
      const container = element?.parentElement?.parentElement;
      expect(container).toHaveClass(className);
    });
  });

  it('should call fromNow with omitSuffix when omitSuffix is true', async () => {
    const timestamp = '2021-04-23T16:33:00Z';
    const mockDate = new Date(timestamp);
    mockDateTime.fromNow.mockReturnValue('2 minutes');

    const now = new Date();
    const timeDiff = now.getTime() - mockDate.getTime();
    if (timeDiff < 630000) {
      mockDateTime.fromNow.mockReturnValue('2 minutes');
    }

    await renderInTestApp(<Timestamp timestamp={timestamp} omitSuffix />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
    });

    expect(mockDateTime.fromNow).toHaveBeenCalledWith(mockDate, undefined, {
      omitSuffix: true,
    });
  });

  it('should show relative time for recent dates (< 10.5 minutes)', async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const timestamp = fiveMinutesAgo.toISOString();
    mockDateTime.fromNow.mockReturnValue('5 minutes ago');

    await renderInTestApp(<Timestamp timestamp={timestamp} />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent('5 minutes ago');
    });

    expect(mockDateTime.fromNow).toHaveBeenCalled();
  });

  it('should show formatted date for older dates (> 10.5 minutes)', async () => {
    const timestamp = '2020-01-01T00:00:00Z';
    const mockDate = new Date(timestamp);
    // Mock to simulate older date (beyond 10.5 minutes)
    mockDateTimeFormatter.mockReturnValue('Jan 1, 2020, 12:00 AM');

    await renderInTestApp(<Timestamp timestamp={timestamp} />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
      expect(element).toHaveTextContent('Jan 1, 2020, 12:00 AM');
    });

    expect(mockDateTimeFormatter).toHaveBeenCalledWith(mockDate);
  });

  it('should display UTC time in tooltip', async () => {
    const timestamp = '2021-04-23T16:33:00Z';
    const mockDate = new Date(timestamp);
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');
    mockUtcDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM UTC');

    await renderInTestApp(<Timestamp timestamp={timestamp} />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
    });

    expect(mockUtcDateTimeFormatter).toHaveBeenCalledWith(mockDate);
  });

  it('should handle number timestamp as ISO string', async () => {
    const timestamp = 1619197980000; // Milliseconds timestamp
    const mockDate = new Date(timestamp);
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');

    await renderInTestApp(<Timestamp timestamp={timestamp} />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
    });

    expect(mockDateTime.isValid).toHaveBeenCalledWith(mockDate);
  });

  it('should handle Unix timestamp in seconds when isUnix is true', async () => {
    const unixTimestamp = 1619197980; // Unix timestamp in seconds
    const expectedDate = new Date(unixTimestamp * 1000);
    mockDateTimeFormatter.mockReturnValue('Apr 23, 2021, 4:33 PM');

    await renderInTestApp(<Timestamp timestamp={unixTimestamp} isUnix />);

    await waitFor(() => {
      const element = getByTest('timestamp');
      expect(element).toBeInTheDocument();
    });

    expect(mockDateTime.isValid).toHaveBeenCalledWith(expectedDate);
  });

  it('should not render tooltip in simple mode', async () => {
    // Use a recent timestamp to get relative time
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const recentTimestamp = twoMinutesAgo.toISOString();
    mockDateTime.fromNow.mockReturnValue('2 minutes ago');

    await renderInTestApp(<Timestamp timestamp={recentTimestamp} simple />);

    await waitFor(() => {
      expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });

    // In simple mode, there should be no tooltip wrapper (no data-test attribute)
    expect(getByTest('timestamp')).not.toBeInTheDocument();
  });
});

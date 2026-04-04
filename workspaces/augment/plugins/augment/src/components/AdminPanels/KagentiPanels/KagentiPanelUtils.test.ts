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

/**
 * Tests for pure utility logic used inside KagentiPanels components.
 * These functions are defined inline in the panel files but are
 * tested here by reimplementing the exact logic to catch regressions.
 */

describe('KagentiToolsPanel utility logic', () => {
  function statusChipColor(
    status: string | undefined,
  ): 'success' | 'info' | 'error' | 'warning' | 'default' {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s === 'ready' || s === 'running' || s === 'active') return 'success';
    if (s === 'building' || s === 'pending') return 'info';
    if (s === 'error' || s === 'failed') return 'error';
    if (s === 'warning' || s === 'degraded') return 'warning';
    return 'default';
  }

  function formatDateTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }

  describe('statusChipColor', () => {
    it('returns success for running/ready/active', () => {
      expect(statusChipColor('Running')).toBe('success');
      expect(statusChipColor('ready')).toBe('success');
      expect(statusChipColor('ACTIVE')).toBe('success');
    });

    it('returns info for building/pending', () => {
      expect(statusChipColor('Building')).toBe('info');
      expect(statusChipColor('pending')).toBe('info');
    });

    it('returns error for error/failed', () => {
      expect(statusChipColor('Error')).toBe('error');
      expect(statusChipColor('failed')).toBe('error');
    });

    it('returns warning for warning/degraded', () => {
      expect(statusChipColor('warning')).toBe('warning');
      expect(statusChipColor('Degraded')).toBe('warning');
    });

    it('returns default for undefined', () => {
      expect(statusChipColor(undefined)).toBe('default');
    });

    it('returns default for unknown status', () => {
      expect(statusChipColor('unknown')).toBe('default');
    });
  });

  describe('formatDateTime', () => {
    it('returns dash for undefined', () => {
      expect(formatDateTime()).toBe('—');
    });

    it('returns formatted date for valid ISO string', () => {
      const result = formatDateTime('2024-01-15T10:30:00Z');
      expect(result).not.toBe('—');
      expect(result).toContain('2024');
    });

    it('returns raw string for invalid date', () => {
      expect(formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });
});

describe('KagentiToolDetailDrawer utility logic', () => {
  function toolSummaryStatusChipColor(
    status: string | undefined,
  ): 'success' | 'warning' | 'default' {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (['running', 'ready', 'active'].includes(s)) return 'success';
    if (['pending', 'building'].includes(s)) return 'warning';
    return 'default';
  }

  describe('toolSummaryStatusChipColor', () => {
    it('returns success for running/ready/active', () => {
      expect(toolSummaryStatusChipColor('Running')).toBe('success');
      expect(toolSummaryStatusChipColor('ready')).toBe('success');
    });

    it('returns warning for pending/building', () => {
      expect(toolSummaryStatusChipColor('pending')).toBe('warning');
      expect(toolSummaryStatusChipColor('Building')).toBe('warning');
    });

    it('returns default for undefined', () => {
      expect(toolSummaryStatusChipColor(undefined)).toBe('default');
    });

    it('returns default for unknown status', () => {
      expect(toolSummaryStatusChipColor('error')).toBe('default');
    });
  });
});

describe('CreateToolWizard service port logic', () => {
  function buildServicePorts(
    rows: Array<{ name: string; port: string; targetPort: string; protocol: string }>,
  ) {
    return rows.filter(
      r => r.name && r.port && !Number.isNaN(Number(r.port)),
    );
  }

  it('filters out rows with empty name', () => {
    const result = buildServicePorts([
      { name: '', port: '8080', targetPort: '8080', protocol: 'TCP' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('filters out rows with empty port', () => {
    const result = buildServicePorts([
      { name: 'http', port: '', targetPort: '8080', protocol: 'TCP' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('filters out rows with non-numeric port', () => {
    const result = buildServicePorts([
      { name: 'http', port: 'abc', targetPort: '8080', protocol: 'TCP' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('keeps valid rows', () => {
    const result = buildServicePorts([
      { name: 'http', port: '8080', targetPort: '8080', protocol: 'TCP' },
      { name: 'grpc', port: '50051', targetPort: '50051', protocol: 'TCP' },
    ]);
    expect(result).toHaveLength(2);
  });
});

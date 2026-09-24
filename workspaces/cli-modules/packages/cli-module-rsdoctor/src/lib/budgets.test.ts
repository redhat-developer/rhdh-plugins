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
  diffSizes,
  evaluateBaseline,
  evaluateBudgets,
  matchesBudgetKey,
  parseIncrease,
  parseSize,
} from './budgets';
import { buildSizesReport, SizeEntry, stableAssetKey } from './sizes';

const entry = (
  file: string,
  gzip: number,
  extra: Partial<SizeEntry> = {},
): SizeEntry => ({
  key: stableAssetKey(file),
  file,
  initial: false,
  type: file.endsWith('.css') ? 'css' : 'js',
  size: gzip * 3,
  gzip,
  ...extra,
});

const report = buildSizesReport(
  [
    entry('static/main.18ca36fc42ba.js', 6_000, {
      chunk: 'main',
      initial: true,
    }),
    entry('static/module-backstage.f3e5465d5719.js', 250_000, {
      chunk: 'backstage',
      initial: true,
    }),
    entry('static/698.742ea8a8b289.chunk.js', 700),
    entry('static/3616.9eb657a04064.chunk.js', 500_000),
    entry('static/5461.5461.4abfb4091f55.css', 40_000),
  ],
  'app',
);

describe('stableAssetKey', () => {
  it('strips content hashes', () => {
    expect(stableAssetKey('static/main.18ca36fc42ba.js')).toBe(
      'static/main.js',
    );
    expect(stableAssetKey('static/698.742ea8a8b289.chunk.js')).toBe(
      'static/698.chunk.js',
    );
    expect(stableAssetKey('remoteEntry.js')).toBe('remoteEntry.js');
  });
});

describe('parseSize / parseIncrease', () => {
  it('parses byte counts and units', () => {
    expect(parseSize(1234)).toBe(1234);
    expect(parseSize('600 KB')).toBe(614_400);
    expect(parseSize('1.5MB')).toBe(1_572_864);
    expect(() => parseSize('lots')).toThrow(/Invalid size/);
  });
  it('parses percentages and sizes as increase limits', () => {
    expect(parseIncrease('5%')).toEqual({ percent: 5 });
    expect(parseIncrease('10 KB')).toEqual({ bytes: 10_240 });
  });
});

describe('matchesBudgetKey', () => {
  const main = entry('static/main.18ca36fc42ba.js', 1, { chunk: 'main' });
  it('matches chunk names, hash-less keys, file names and wildcards', () => {
    expect(matchesBudgetKey(main, 'main')).toBe(true);
    expect(matchesBudgetKey(main, 'static/main.js')).toBe(true);
    expect(matchesBudgetKey(main, 'static/main.18ca36fc42ba.js')).toBe(true);
    expect(matchesBudgetKey(main, 'static/*.js')).toBe(true);
    expect(matchesBudgetKey(main, 'ma*')).toBe(true);
    expect(matchesBudgetKey(main, 'main.js')).toBe(true);
    expect(matchesBudgetKey(main, 'static/*.chunk.js')).toBe(false);
    expect(matchesBudgetKey(main, 'vendor')).toBe(false);
  });
});

describe('evaluateBudgets', () => {
  it('reports totals, single files and named chunks that exceed a limit', () => {
    const { violations, notes } = evaluateBudgets(report, {
      maxInitialSize: '200 KB',
      maxTotalSize: '2 MB',
      maxChunkSize: '400 KB',
      chunks: {
        main: '10 KB',
        backstage: '100 KB',
        'static/698.chunk.js': 500,
      },
    });
    expect(violations).toEqual([
      expect.stringMatching(
        /^initial JS: 250.0 KB gzip, limit 200.0 KB exceeded/,
      ),
      expect.stringMatching(
        /^static\/3616.chunk.js: 488.3 KB gzip exceeds maxChunkSize/,
      ),
      expect.stringMatching(
        /^static\/module-backstage.js \(backstage\): 244.1 KB gzip, limit 100.0 KB \(backstage\) exceeded/,
      ),
      expect.stringMatching(
        /^static\/698.chunk.js: 700 B gzip, limit 500 B \(static\/698.chunk.js\) exceeded/,
      ),
    ]);
    expect(notes).toEqual([
      expect.stringMatching(/^total JS: .* ok$/),
      expect.stringMatching(
        /^static\/main.js \(main\): 5.9 KB gzip, limit 10.0 KB \(main\) ok$/,
      ),
    ]);
  });

  it('applies wildcard keys, the catch-all for all other files and maxChunks', () => {
    const { violations, notes } = evaluateBudgets(report, {
      maxChunks: 3,
      chunks: {
        'module-*': '300 KB',
        'static/*.chunk.js': '1 KB',
        '*': '5 KB',
      },
    });
    expect(violations).toEqual([
      expect.stringMatching(/^4 JS files, maxChunks 3 exceeded by 1$/),
      expect.stringMatching(
        /^static\/3616.chunk.js: 488.3 KB gzip, limit 1.0 KB \(static\/\*.chunk.js\) exceeded/,
      ),
      expect.stringMatching(
        /^static\/5461.5461.css: 39.1 KB gzip, limit 5.0 KB \(\*\) exceeded/,
      ),
      expect.stringMatching(
        /^static\/main.js \(main\): 5.9 KB gzip, limit 5.0 KB \(\*\) exceeded/,
      ),
    ]);
    expect(notes).toEqual([
      expect.stringMatching(
        /^static\/module-backstage.js \(backstage\): 244.1 KB gzip, limit 300.0 KB \(module-\*\) ok$/,
      ),
      expect.stringMatching(
        /^static\/698.chunk.js: 700 B gzip, limit 1.0 KB \(static\/\*.chunk.js\) ok$/,
      ),
      expect.stringMatching(
        /^0 other files within the catch-all limit 5.0 KB ok$/,
      ),
    ]);
  });

  it('passes when everything is within limits', () => {
    const { violations } = evaluateBudgets(report, {
      maxInitialSize: '300 KB',
      maxChunkSize: '600 KB',
      maxChunks: 10,
      chunks: { '*': '500 KB' },
    });
    expect(violations).toEqual([]);
  });
});

describe('diffSizes / evaluateBaseline', () => {
  const current = buildSizesReport(
    [
      entry('static/main.aaaaaaaaaaaa.js', 9_000, {
        chunk: 'main',
        initial: true,
      }),
      entry('static/module-backstage.bbbbbbbbbbbb.js', 250_000, {
        chunk: 'backstage',
        initial: true,
      }),
      entry('static/3616.cccccccccccc.chunk.js', 480_000),
      entry('static/9999.dddddddddddd.chunk.js', 2_000),
      entry('static/5461.5461.eeeeeeeeeeee.css', 40_000),
    ],
    'app',
  );

  it('matches files across builds by hash-less key', () => {
    const deltas = diffSizes(report, current);
    expect(deltas.map(d => [d.key, d.delta])).toEqual([
      ['static/3616.chunk.js', -20_000],
      ['static/main.js', 3_000],
      ['static/9999.chunk.js', 2_000],
      ['static/698.chunk.js', -700],
      ['static/module-backstage.js', 0],
      ['static/5461.5461.css', 0],
    ]);
  });

  it('fails on growth of existing files and reports new and removed files', () => {
    const { violations, notes } = evaluateBaseline(report, current, {
      maxInitialIncrease: '1%',
      maxTotalIncrease: '50 KB',
      maxChunkIncrease: '20%',
    });
    expect(violations).toEqual([
      expect.stringMatching(
        /^initial JS: 250.0 KB -> 252.9 KB gzip, \+2.9 KB \(1.2%\), limit 1% exceeded$/,
      ),
      expect.stringMatching(
        /^static\/main.js \(main\): 5.9 KB -> 8.8 KB gzip, \+2.9 KB \(50.0%\), limit 20% exceeded$/,
      ),
    ]);
    expect(notes).toEqual([
      expect.stringMatching(/^total JS: .* ok$/),
      expect.stringMatching(
        /^1 new file\(s\) compared to the baseline: static\/9999.chunk.js 2.0 KB$/,
      ),
      expect.stringMatching(
        /^1 file\(s\) from the baseline no longer exist: static\/698.chunk.js 700 B$/,
      ),
    ]);
  });

  it('checks new files against the newChunks policy', () => {
    expect(
      evaluateBaseline(report, current, { newChunks: 'fail' }).violations,
    ).toEqual([
      expect.stringMatching(
        /^static\/9999.chunk.js: new file of 2.0 KB gzip, new files are not allowed/,
      ),
    ]);
    expect(
      evaluateBaseline(report, current, { newChunks: '1 KB', maxNewChunks: 0 })
        .violations,
    ).toEqual([
      expect.stringMatching(
        /^static\/9999.chunk.js: new file of 2.0 KB gzip, newChunks limit 1.0 KB exceeded by 976 B$/,
      ),
      expect.stringMatching(
        /^1 new files compared to the baseline, maxNewChunks 0 exceeded$/,
      ),
    ]);
    expect(
      evaluateBaseline(report, current, { newChunks: '5 KB' }).violations,
    ).toEqual([]);
  });
});

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
import { parseCsvContent, CsvProjectRow } from './parseCsvContent';

function toDataUrl(csv: string): string {
  return `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
}

const FULL_HEADERS =
  'name,description,abbreviation,ownedByGroup,sourceRepoUrl,sourceRepoBranch,targetRepoUrl,targetRepoBranch';

function fullRow(overrides: Partial<Record<string, string>> = {}): string {
  const defaults: Record<string, string> = {
    name: 'My Project',
    description: 'A description',
    abbreviation: 'PRJ',
    ownedByGroup: 'group:default/team-a',
    sourceRepoUrl: 'https://github.com/org/source',
    sourceRepoBranch: 'main',
    targetRepoUrl: 'https://github.com/org/target',
    targetRepoBranch: 'main',
  };
  const merged = { ...defaults, ...overrides };
  return [
    merged.name,
    merged.description,
    merged.abbreviation,
    merged.ownedByGroup,
    merged.sourceRepoUrl,
    merged.sourceRepoBranch,
    merged.targetRepoUrl,
    merged.targetRepoBranch,
  ].join(',');
}

describe('parseCsvContent', () => {
  describe('data-URL decoding', () => {
    it('should reject a plain string that is not a data-URL', () => {
      expect(() => parseCsvContent('not-a-data-url')).toThrow(
        'expected a base64-encoded data-URL',
      );
    });

    it('should reject a data-URL without base64 encoding', () => {
      expect(() => parseCsvContent('data:text/csv,hello')).toThrow(
        'expected a base64-encoded data-URL',
      );
    });

    it('should accept data:text/csv;base64,...', () => {
      const csv = `${FULL_HEADERS}\n${fullRow()}`;
      expect(() => parseCsvContent(toDataUrl(csv))).not.toThrow();
    });

    it('should accept data:application/vnd.ms-excel;base64,...', () => {
      const csv = `${FULL_HEADERS}\n${fullRow()}`;
      const encoded = Buffer.from(csv).toString('base64');
      const dataUrl = `data:application/vnd.ms-excel;base64,${encoded}`;
      expect(() => parseCsvContent(dataUrl)).not.toThrow();
    });

    it('should accept data URLs with extra parameters like name=...', () => {
      const csv = `${FULL_HEADERS}\n${fullRow()}`;
      const encoded = Buffer.from(csv).toString('base64');
      const dataUrl = `data:text/csv;name=x2a-projects.csv;base64,${encoded}`;
      expect(() => parseCsvContent(dataUrl)).not.toThrow();
    });

    it('should decode correctly when globalThis.Buffer is unavailable (atob fallback)', () => {
      const originalBuffer = globalThis.Buffer;
      const { TextDecoder: OriginalTextDecoder } = require('util');
      try {
        // @ts-ignore — force-remove Buffer to simulate a browser environment
        delete (globalThis as any).Buffer;
        // TextDecoder exists in browsers but may not be global in older Node/Jest
        (globalThis as any).TextDecoder =
          (globalThis as any).TextDecoder ?? OriginalTextDecoder;

        const csv = `${FULL_HEADERS}\n${fullRow()}`;
        const encoded = originalBuffer.from(csv).toString('base64');
        const dataUrl = `data:text/csv;base64,${encoded}`;

        const rows = parseCsvContent(dataUrl);
        expect(rows).toHaveLength(1);
        expect(rows[0].name).toBe('My Project');
      } finally {
        globalThis.Buffer = originalBuffer;
      }
    });

    it('should decode UTF-8 content correctly via atob fallback', () => {
      const originalBuffer = globalThis.Buffer;
      const { TextDecoder: OriginalTextDecoder } = require('util');
      try {
        // @ts-ignore
        delete (globalThis as any).Buffer;
        (globalThis as any).TextDecoder =
          (globalThis as any).TextDecoder ?? OriginalTextDecoder;

        const csv = `${FULL_HEADERS}\n${fullRow({ name: 'Ünïcödé Pröjéct' })}`;
        const encoded = originalBuffer.from(csv).toString('base64');
        const dataUrl = `data:text/csv;base64,${encoded}`;

        const rows = parseCsvContent(dataUrl);
        expect(rows[0].name).toBe('Ünïcödé Pröjéct');
      } finally {
        globalThis.Buffer = originalBuffer;
      }
    });
  });

  describe('header validation', () => {
    it.each([
      'name',
      'abbreviation',
      'sourceRepoUrl',
      'sourceRepoBranch',
      'targetRepoBranch',
    ])('should throw when required column "%s" is missing', column => {
      const headers = FULL_HEADERS.split(',')
        .filter(h => h !== column)
        .join(',');
      const csv = `${headers}\nval1,val2,val3,val4,val5,val6,val7`;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        `CSV is missing required column: "${column}"`,
      );
    });

    it('should throw when an unknown column is present', () => {
      const csv = `${FULL_HEADERS},extraCol\n${fullRow()},extra`;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        'CSV contains unknown column(s): "extraCol"',
      );
    });

    it('should list all unknown columns in the error', () => {
      const csv = `${FULL_HEADERS},foo,bar\n${fullRow()},x,y`;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        'CSV contains unknown column(s): "foo", "bar"',
      );
    });

    it('should accept CSV with only required columns', () => {
      const headers =
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch';
      const csv = `${headers}\nProj,PRJ,https://github.com/o/r,main,main`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows).toHaveLength(1);
    });

    it('should strip BOM from the first header', () => {
      const csvWithBom = `\uFEFF${FULL_HEADERS}\n${fullRow()}`;
      expect(() => parseCsvContent(toDataUrl(csvWithBom))).not.toThrow();
    });

    it('should trim whitespace from header names', () => {
      const headers =
        ' name , description , abbreviation , ownedByGroup , sourceRepoUrl , sourceRepoBranch , targetRepoUrl , targetRepoBranch ';
      const csv = `${headers}\n${fullRow()}`;
      expect(() => parseCsvContent(toDataUrl(csv))).not.toThrow();
    });
  });

  describe('row validation', () => {
    it('should throw when the CSV has no data rows', () => {
      const csv = FULL_HEADERS;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        'at least one data row',
      );
    });

    it('should throw when a header-only CSV has a trailing newline', () => {
      const csv = `${FULL_HEADERS}\n`;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        'at least one data row',
      );
    });

    it.each([
      'name',
      'abbreviation',
      'sourceRepoUrl',
      'sourceRepoBranch',
      'targetRepoBranch',
    ])(
      'should throw when required field "%s" is empty in a data row',
      field => {
        const csv = `${FULL_HEADERS}\n${fullRow({ [field]: '' })}`;
        expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
          `CSV row 2 is missing required field: "${field}"`,
        );
      },
    );

    it('should report the correct row number for errors in later rows', () => {
      const csv = `${FULL_HEADERS}\n${fullRow()}\n${fullRow({ name: '' })}`;
      expect(() => parseCsvContent(toDataUrl(csv))).toThrow(
        'CSV row 3 is missing required field: "name"',
      );
    });
  });

  describe('successful parsing', () => {
    it('should parse a single row with all columns', () => {
      const csv = `${FULL_HEADERS}\n${fullRow()}`;
      const rows = parseCsvContent(toDataUrl(csv));

      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual<CsvProjectRow>({
        name: 'My Project',
        description: 'A description',
        abbreviation: 'PRJ',
        ownedByGroup: 'group:default/team-a',
        sourceRepoUrl: 'https://github.com/org/source',
        sourceRepoBranch: 'main',
        targetRepoUrl: 'https://github.com/org/target',
        targetRepoBranch: 'main',
      });
    });

    it('should parse multiple rows', () => {
      const csv = [
        FULL_HEADERS,
        fullRow({ name: 'Project A', abbreviation: 'PA' }),
        fullRow({ name: 'Project B', abbreviation: 'PB' }),
        fullRow({ name: 'Project C', abbreviation: 'PC' }),
      ].join('\n');

      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows).toHaveLength(3);
      expect(rows.map(r => r.name)).toEqual([
        'Project A',
        'Project B',
        'Project C',
      ]);
    });

    it('should skip empty lines between data rows', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({ name: 'A' })}\n\n${fullRow({ name: 'B' })}\n`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.name)).toEqual(['A', 'B']);
    });

    it('should handle Windows-style CRLF line endings', () => {
      const csv = `${FULL_HEADERS}\r\n${fullRow()}\r\n`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows).toHaveLength(1);
    });
  });

  describe('optional fields and defaults', () => {
    it('should default description to empty string when missing', () => {
      const headers =
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch';
      const csv = `${headers}\nProj,PRJ,https://github.com/o/r,main,develop`;

      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].description).toBe('');
    });

    it('should default description to empty string when column is present but value is blank', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({ description: '' })}`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].description).toBe('');
    });

    it('should set ownedByGroup to undefined when missing from columns', () => {
      const headers =
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch';
      const csv = `${headers}\nProj,PRJ,https://github.com/o/r,main,main`;

      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].ownedByGroup).toBeUndefined();
    });

    it('should set ownedByGroup to undefined when present but blank', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({ ownedByGroup: '' })}`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].ownedByGroup).toBeUndefined();
    });

    it('should preserve ownedByGroup when provided', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({ ownedByGroup: 'group:default/ops' })}`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].ownedByGroup).toBe('group:default/ops');
    });

    it('should default targetRepoUrl to sourceRepoUrl when column is missing', () => {
      const headers =
        'name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoBranch';
      const csv = `${headers}\nProj,PRJ,https://github.com/o/shared,main,main`;

      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].targetRepoUrl).toBe('https://github.com/o/shared');
    });

    it('should default targetRepoUrl to sourceRepoUrl when present but blank', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({
        sourceRepoUrl: 'https://github.com/o/shared',
        targetRepoUrl: '',
      })}`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].targetRepoUrl).toBe('https://github.com/o/shared');
    });

    it('should use explicit targetRepoUrl when provided', () => {
      const csv = `${FULL_HEADERS}\n${fullRow({
        sourceRepoUrl: 'https://github.com/o/source',
        targetRepoUrl: 'https://github.com/o/target',
      })}`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].targetRepoUrl).toBe('https://github.com/o/target');
    });
  });

  describe('CSV edge cases', () => {
    it('should handle quoted fields containing commas', () => {
      const csv = `${FULL_HEADERS}\n"Project, with comma",A description,PRJ,group:default/team,https://github.com/o/r,main,https://github.com/o/t,main`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].name).toBe('Project, with comma');
    });

    it('should handle quoted fields containing newlines', () => {
      const csv = `${FULL_HEADERS}\n"Multi\nline name",A description,PRJ,group:default/team,https://github.com/o/r,main,https://github.com/o/t,main`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].name).toBe('Multi\nline name');
    });

    it('should handle escaped double quotes inside quoted fields', () => {
      const csv = `${FULL_HEADERS}\n"Project ""Alpha""",A description,PRJ,group:default/team,https://github.com/o/r,main,https://github.com/o/t,main`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].name).toBe('Project "Alpha"');
    });

    it('should trim whitespace from field values', () => {
      const csv = `${FULL_HEADERS}\n  My Project  ,  desc  ,  PRJ  , group:default/team ,https://github.com/o/r, main ,https://github.com/o/t, develop `;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0]).toMatchObject({
        name: 'My Project',
        description: 'desc',
        abbreviation: 'PRJ',
        ownedByGroup: 'group:default/team',
        sourceRepoBranch: 'main',
        targetRepoBranch: 'develop',
      });
    });

    it('should handle columns in any order', () => {
      const headers =
        'targetRepoBranch,sourceRepoBranch,sourceRepoUrl,abbreviation,name';
      const csv = `${headers}\ndevelop,main,https://github.com/o/r,ABC,Reverse Order`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0]).toMatchObject({
        name: 'Reverse Order',
        abbreviation: 'ABC',
        sourceRepoUrl: 'https://github.com/o/r',
        sourceRepoBranch: 'main',
        targetRepoBranch: 'develop',
      });
    });

    it('should handle different SCM provider URLs', () => {
      const csv = [
        FULL_HEADERS,
        fullRow({
          name: 'GitHub Project',
          sourceRepoUrl: 'https://github.com/org/repo',
          targetRepoUrl: 'https://github.com/org/target',
        }),
        fullRow({
          name: 'GitLab Project',
          sourceRepoUrl: 'https://gitlab.com/group/repo',
          targetRepoUrl: 'https://gitlab.com/group/target',
        }),
        fullRow({
          name: 'Bitbucket Project',
          sourceRepoUrl: 'https://bitbucket.org/ws/repo',
          targetRepoUrl: 'https://bitbucket.org/ws/target',
        }),
      ].join('\n');

      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows).toHaveLength(3);
      expect(rows[0].sourceRepoUrl).toBe('https://github.com/org/repo');
      expect(rows[1].sourceRepoUrl).toBe('https://gitlab.com/group/repo');
      expect(rows[2].sourceRepoUrl).toBe('https://bitbucket.org/ws/repo');
    });

    it('should handle UTF-8 content with special characters', () => {
      const csv = `${FULL_HEADERS}\nProjekt Ünïcödé,Beschreibung — mit Sonderzeichen,UNI,,https://github.com/o/r,main,,main`;
      const rows = parseCsvContent(toDataUrl(csv));
      expect(rows[0].name).toBe('Projekt Ünïcödé');
      expect(rows[0].description).toBe('Beschreibung — mit Sonderzeichen');
    });
  });
});

/**
 * Tests for MVSoulConnector
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MVSoulConnector } from '../mv-soul.js';

describe('MVSoulConnector', () => {
  let connector: MVSoulConnector;

  beforeEach(() => {
    connector = new MVSoulConnector({
      type: 'mv-soul' as any,
      orgId: 'test-org',
      name: 'Test MV',
      enabled: false, // Don't connect
      config: {
        host: 'localhost',
        port: 5000,
        timeout: 5000,
        keepAlive: false,
        encoding: 'utf8',
        mllp: { startByte: 0x0b, endByte1: 0x1c, endByte2: 0x0d },
        enableResultsIntegration: true,
        xmlFormat: 'standard',
      },
    });
  });

  it('should build valid MV XML', () => {
    const data = {
      visitId: '123456',
      patientId: 'P001',
      results: [
        {
          examCode: 'GLU',
          examName: 'Glicose',
          resultDate: '2023-12-15T12:00:00Z',
          status: 'F',
          items: [
            {
              code: 'GLU',
              name: 'Glicose',
              value: '99',
              unit: 'mg/dL',
              referenceRange: '70-110',
              abnormalFlag: 'N',
            },
          ],
        },
      ],
    };

    const xml = (connector as any).buildMVXml(data);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<mv_integracao');
    expect(xml).toContain('<cd_atendimento>123456</cd_atendimento>');
    expect(xml).toContain('<cd_paciente>P001</cd_paciente>');
    expect(xml).toContain('<vl_resultado>99</vl_resultado>');
  });

  it('should escape XML special characters', () => {
    const escaped = (connector as any).escapeXml('Test & <tag> "quoted" \'single\'');

    expect(escaped).toBe('Test &amp; &lt;tag&gt; &quot;quoted&quot; &apos;single&apos;');
  });

  it('should parse MV XML response', () => {
    const xml = '<?xml version="1.0"?><response><sucesso>true</sucesso></response>';
    const parsed = connector.parseXmlResponse(xml);

    // XML parser converts "true" string to boolean true
    expect(parsed.response.sucesso).toBe(true);
  });

  it('should transform data to MV format', () => {
    const sourceData = {
      visitId: 'V123',
      patientId: 'P456',
      results: [
        {
          code: 'HGB',
          name: 'Hemoglobina',
          date: '2023-12-15',
          status: 'F',
          items: [{ code: 'HGB', name: 'Hemoglobina', value: '14.5' }],
        },
      ],
    };

    const mvData = connector.transformToMVFormat(sourceData);

    expect(mvData.visitId).toBe('V123');
    expect(mvData.patientId).toBe('P456');
    expect(mvData.results).toHaveLength(1);
    expect(mvData.results[0].examCode).toBe('HGB');
  });
});

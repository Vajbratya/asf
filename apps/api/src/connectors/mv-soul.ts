/**
 * S21 - MV Soul Connector
 *
 * Connector for MV Soul HIS (Hospital Information System).
 * Supports both HL7 MLLP for ADT/ORM messages and XML integration for results.
 */

import axios, { AxiosInstance } from 'axios';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { GenericHL7Connector } from './generic-hl7.js';
import type { MVSoulConfig, ConnectorMessage } from '../types/connector.js';
import type { BaseConnectorConfig } from './base.js';

interface MVSoulConnectorConfig extends BaseConnectorConfig {
  config: MVSoulConfig;
}

interface MVResultData {
  visitId: string;
  patientId: string;
  results: MVResult[];
}

interface MVResult {
  examCode: string;
  examName: string;
  resultDate: string;
  status: string;
  items: MVResultItem[];
}

interface MVResultItem {
  code: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
}

export class MVSoulConnector extends GenericHL7Connector {
  private mvConfig: MVSoulConfig;
  private xmlClient?: AxiosInstance;
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  constructor(config: MVSoulConnectorConfig) {
    super(config);
    this.mvConfig = config.config;

    // Initialize XML parser/builder
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });

    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      suppressEmptyNode: true,
    });

    // Initialize XML HTTP client if configured
    if (this.mvConfig.xmlEndpoint && this.mvConfig.enableResultsIntegration) {
      this.xmlClient = axios.create({
        baseURL: this.mvConfig.xmlEndpoint,
        timeout: this.hl7Config.timeout || 30000,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
      });

      this.logger.info({ endpoint: this.mvConfig.xmlEndpoint }, 'MV Soul XML client initialized');
    }
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (this.mvConfig.enableResultsIntegration && !this.mvConfig.xmlEndpoint) {
      this.logger.warn('Results integration enabled but no XML endpoint configured');
    }
  }

  /**
   * Send lab/imaging results to MV Soul via XML integration
   */
  async sendResults(resultData: MVResultData): Promise<void> {
    if (!this.xmlClient) {
      throw this.createError('MV Soul XML integration not configured', 'XML_NOT_CONFIGURED', false);
    }

    try {
      this.logger.info(
        { visitId: resultData.visitId, resultCount: resultData.results.length },
        'Sending results to MV Soul'
      );

      // Build MV XML format
      const xml = this.buildMVXml(resultData);

      // Log XML for debugging
      this.logger.debug({ xml }, 'Generated MV XML');

      // Send to MV Soul
      const response = await this.xmlClient.post('', xml, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
      });

      // Parse response
      const responseData = this.xmlParser.parse(response.data);

      // Check for errors in response
      if (responseData.error || responseData.erro) {
        throw this.createError(
          `MV Soul rejected results: ${responseData.error || responseData.erro}`,
          'RESULTS_REJECTED',
          false,
          { response: responseData }
        );
      }

      this.recordMessageSent();
      this.logger.info({ visitId: resultData.visitId }, 'Results sent successfully');
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to send results to MV Soul: ${(error as Error).message}`,
        'XML_ERROR',
        true
      );
    }
  }

  /**
   * Escape XML special characters to prevent injection
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Build MV Soul XML format for results
   */
  private buildMVXml(data: MVResultData): string {
    // Escape all user-provided data to prevent XML injection
    const mvIntegration: any = {
      mv_integracao: {
        '@_tipo': 'RESULTADO',
        '@_versao': '1.0',
        atendimento: {
          cd_atendimento: this.escapeXml(data.visitId),
          cd_paciente: this.escapeXml(data.patientId),
          resultados: {
            resultado: data.results.map((result) => ({
              cd_exame: this.escapeXml(result.examCode),
              nm_exame: this.escapeXml(result.examName),
              dt_resultado: this.escapeXml(result.resultDate),
              st_resultado: this.escapeXml(result.status),
              itens: {
                item: result.items.map((item) => ({
                  cd_item: this.escapeXml(item.code),
                  nm_item: this.escapeXml(item.name),
                  vl_resultado: this.escapeXml(item.value),
                  un_medida: this.escapeXml(item.unit || ''),
                  vl_referencia: this.escapeXml(item.referenceRange || ''),
                  sn_anormal: this.escapeXml(item.abnormalFlag || 'N'),
                })),
              },
            })),
          },
        },
      },
    };

    // Build XML string
    const xml = this.xmlBuilder.build(mvIntegration);

    // Add XML declaration
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }

  /**
   * Parse MV Soul XML response
   */
  parseXmlResponse(xmlString: string): any {
    try {
      const parsed = this.xmlParser.parse(xmlString);
      return parsed;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to parse MV Soul XML response: ${(error as Error).message}`,
        'XML_PARSE_ERROR',
        false
      );
    }
  }

  /**
   * Query patient visits from MV Soul
   */
  async queryPatientVisits(patientId: string): Promise<any> {
    if (!this.xmlClient) {
      throw this.createError('MV Soul XML integration not configured', 'XML_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ patientId }, 'Querying patient visits from MV Soul');

      const queryXml = this.buildQueryXml('ATENDIMENTOS', {
        cd_paciente: patientId,
      });

      const response = await this.xmlClient.post('', queryXml);
      const data = this.xmlParser.parse(response.data);

      this.logger.debug({ patientId }, 'Patient visits retrieved');

      return data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to query patient visits: ${(error as Error).message}`,
        'XML_ERROR',
        true
      );
    }
  }

  /**
   * Build MV Soul query XML
   */
  private buildQueryXml(queryType: string, params: Record<string, any>): string {
    // Escape all parameter values to prevent XML injection
    const escapedParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      escapedParams[key] = typeof value === 'string' ? this.escapeXml(value) : value;
    }

    const mvQuery: any = {
      mv_integracao: {
        '@_tipo': 'CONSULTA',
        '@_consulta': this.escapeXml(queryType),
        parametros: escapedParams,
      },
    };

    const xml = this.xmlBuilder.build(mvQuery);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
  }

  /**
   * Send ADT (Admission/Discharge/Transfer) message via HL7
   */
  async sendAdtMessage(message: ConnectorMessage): Promise<void> {
    // Ensure message type is ADT
    if (!message.type.startsWith('ADT')) {
      throw this.createError(
        'Invalid message type for ADT. Expected ADT^A01, ADT^A02, etc.',
        'INVALID_MESSAGE_TYPE',
        false
      );
    }

    // Send via parent HL7 connector
    await super.send(message);
  }

  /**
   * Send ORM (Order) message via HL7
   */
  async sendOrderMessage(message: ConnectorMessage): Promise<void> {
    // Ensure message type is ORM
    if (!message.type.startsWith('ORM')) {
      throw this.createError(
        'Invalid message type for Order. Expected ORM^O01',
        'INVALID_MESSAGE_TYPE',
        false
      );
    }

    // Send via parent HL7 connector
    await super.send(message);
  }

  /**
   * Transform result data to MV format
   */
  transformToMVFormat(sourceData: any): MVResultData {
    // This is a simplified transformation - real implementation would be more complex
    // and would handle different source formats

    const mvData: MVResultData = {
      visitId: sourceData.visitId || sourceData.visit_id || '',
      patientId: sourceData.patientId || sourceData.patient_id || '',
      results: [],
    };

    // Transform results
    if (sourceData.results || sourceData.exams) {
      const results = sourceData.results || sourceData.exams;

      mvData.results = results.map((result: any) => ({
        examCode: result.code || result.exam_code || '',
        examName: result.name || result.exam_name || '',
        resultDate: result.date || result.result_date || new Date().toISOString(),
        status: result.status || 'F', // F = Final
        items: this.transformResultItems(result.items || result.observations || []),
      }));
    }

    return mvData;
  }

  /**
   * Transform result items
   */
  private transformResultItems(items: any[]): MVResultItem[] {
    return items.map((item: any) => ({
      code: item.code || item.observation_code || '',
      name: item.name || item.observation_name || '',
      value: item.value?.toString() || '',
      unit: item.unit || item.units || undefined,
      referenceRange: item.referenceRange || item.reference_range || undefined,
      abnormalFlag: item.abnormal || item.abnormal_flag || 'N',
    }));
  }

  /**
   * Build custom XML for MV Soul (when xmlFormat is 'custom')
   */
  buildCustomXml(data: any): string {
    if (this.mvConfig.xmlFormat === 'custom') {
      // Allow custom XML building logic
      // This can be extended based on specific MV Soul customizations
      this.logger.debug('Building custom MV Soul XML format');
    }

    // Default to standard format
    return this.buildMVXml(data);
  }

  /**
   * Validate MV Soul response
   */
  private validateResponse(response: any): boolean {
    // Check for common error patterns
    if (response.error || response.erro) {
      return false;
    }

    if (response.status === 'error' || response.status === 'erro') {
      return false;
    }

    // Check for success indicators
    if (response.sucesso || response.success) {
      return true;
    }

    // If no explicit error or success, assume success
    return true;
  }
}

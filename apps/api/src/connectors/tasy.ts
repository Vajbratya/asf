/**
 * S20 - Tasy Connector (Philips)
 *
 * Specialized connector for Philips Tasy HIS.
 * Extends GenericHL7Connector with Tasy-specific Z-segments and REST API integration.
 */

import axios, { AxiosInstance } from 'axios';
import { GenericHL7Connector } from './generic-hl7.js';
import type { TasyConfig, ConnectorMessage } from '../types/connector.js';
import type { BaseConnectorConfig } from './base.js';

interface TasyConnectorConfig extends BaseConnectorConfig {
  config: TasyConfig;
}

interface TasyZSegment {
  name: string;
  fields: Record<string, string>;
}

interface TasyPatientPhoto {
  patientId: string;
  photoBase64: string;
  mimeType: string;
}

export class TasyConnector extends GenericHL7Connector {
  private tasyConfig: TasyConfig;
  private apiClient?: AxiosInstance;

  constructor(config: TasyConnectorConfig) {
    super(config);
    this.tasyConfig = config.config;

    // Initialize REST API client if configured
    if (this.tasyConfig.apiUrl && this.tasyConfig.apiKey) {
      this.apiClient = axios.create({
        baseURL: this.tasyConfig.apiUrl,
        timeout: this.hl7Config.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.tasyConfig.apiKey,
        },
      });

      this.logger.info({ apiUrl: this.tasyConfig.apiUrl }, 'Tasy REST API client initialized');
    }
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (this.tasyConfig.enableZSegments && !this.tasyConfig.segments) {
      this.logger.warn('Z-segments enabled but no segment configuration provided');
    }
  }

  async send(message: ConnectorMessage): Promise<void> {
    // Enrich message with Z-segments if enabled
    if (this.tasyConfig.enableZSegments) {
      message = this.enrichWithZSegments(message);
    }

    // Map TUSS codes if configured
    if (this.tasyConfig.tussMapping) {
      message = this.mapTussCodes(message);
    }

    // Send via parent HL7 connector
    await super.send(message);
  }

  /**
   * Enrich HL7 message with Tasy-specific Z-segments
   */
  private enrichWithZSegments(message: ConnectorMessage): ConnectorMessage {
    const enrichedMessage = { ...message };

    if (typeof enrichedMessage.payload === 'string') {
      // Parse HL7 string to add Z-segments
      const segments = enrichedMessage.payload.split('\r');
      const zSegments = this.buildZSegments(message);

      // Add Z-segments after MSH
      segments.splice(1, 0, ...zSegments.map((z) => this.formatZSegment(z)));

      enrichedMessage.payload = segments.join('\r');
    } else {
      // Add Z-segments to structured payload
      if (!enrichedMessage.payload.segments) {
        enrichedMessage.payload.segments = [];
      }

      const zSegments = this.buildZSegments(message);
      enrichedMessage.payload.segments.unshift(...zSegments.map((z) => this.formatZSegment(z)));
    }

    return enrichedMessage;
  }

  /**
   * Build Z-segments based on configuration and message data
   */
  private buildZSegments(message: ConnectorMessage): TasyZSegment[] {
    const segments: TasyZSegment[] = [];
    const data = message.payload;
    const config = this.tasyConfig.segments || {};

    // ZPD - Patient Data
    if (config.ZPD && data.patient) {
      segments.push({
        name: 'ZPD',
        fields: {
          motherName: data.patient.motherName || '',
          birthPlace: data.patient.birthPlace || '',
          nationality: data.patient.nationality || '',
          rg: data.patient.rg || '',
          cpf: data.patient.cpf || '',
          cns: data.patient.cns || '', // Cartão Nacional de Saúde
          occupation: data.patient.occupation || '',
          educationLevel: data.patient.educationLevel || '',
        },
      });
    }

    // ZPV - Visit Data
    if (config.ZPV && data.visit) {
      segments.push({
        name: 'ZPV',
        fields: {
          visitNumber: data.visit.visitNumber || '',
          admissionType: data.visit.admissionType || '',
          serviceType: data.visit.serviceType || '',
          bedNumber: data.visit.bedNumber || '',
          wardCode: data.visit.wardCode || '',
          attendingPhysician: data.visit.attendingPhysician || '',
          admissionDate: data.visit.admissionDate || '',
          dischargeDate: data.visit.dischargeDate || '',
        },
      });
    }

    // ZIN - Insurance Data
    if (config.ZIN && data.insurance) {
      segments.push({
        name: 'ZIN',
        fields: {
          planCode: data.insurance.planCode || '',
          planName: data.insurance.planName || '',
          cardNumber: data.insurance.cardNumber || '',
          validityStart: data.insurance.validityStart || '',
          validityEnd: data.insurance.validityEnd || '',
          holderName: data.insurance.holderName || '',
          relationship: data.insurance.relationship || '',
        },
      });
    }

    // ZOR - Order Data
    if (config.ZOR && data.order) {
      segments.push({
        name: 'ZOR',
        fields: {
          orderNumber: data.order.orderNumber || '',
          orderType: data.order.orderType || '',
          priority: data.order.priority || '',
          requestingPhysician: data.order.requestingPhysician || '',
          orderDate: data.order.orderDate || '',
          clinicalIndication: data.order.clinicalIndication || '',
          tussCode: data.order.tussCode || '',
        },
      });
    }

    return segments;
  }

  /**
   * Format Z-segment into HL7 string
   */
  private formatZSegment(segment: TasyZSegment): string {
    const fields = Object.values(segment.fields).join('|');
    return `${segment.name}|${fields}`;
  }

  /**
   * Map TUSS codes using configured mapping
   */
  private mapTussCodes(message: ConnectorMessage): ConnectorMessage {
    const mappedMessage = { ...message };
    const mapping = this.tasyConfig.tussMapping!;

    // Recursively search for TUSS codes in message payload
    const mapCodes = (obj: any): any => {
      if (typeof obj === 'string' && mapping[obj]) {
        return mapping[obj];
      }
      if (Array.isArray(obj)) {
        return obj.map(mapCodes);
      }
      if (typeof obj === 'object' && obj !== null) {
        const mapped: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'tussCode' && typeof value === 'string' && mapping[value]) {
            mapped[key] = mapping[value];
          } else {
            mapped[key] = mapCodes(value);
          }
        }
        return mapped;
      }
      return obj;
    };

    mappedMessage.payload = mapCodes(mappedMessage.payload);
    return mappedMessage;
  }

  /**
   * Retrieve patient photo from Tasy REST API
   */
  async getPatientPhoto(patientId: string): Promise<TasyPatientPhoto | null> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ patientId }, 'Fetching patient photo from Tasy API');

      const response = await this.apiClient.get(`/patients/${patientId}/photo`, {
        responseType: 'arraybuffer',
      });

      const photoBase64 = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';

      this.logger.debug({ patientId, mimeType }, 'Patient photo retrieved');

      return {
        patientId,
        photoBase64,
        mimeType,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this.logger.debug({ patientId }, 'Patient photo not found');
        return null;
      }

      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve patient photo: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Get patient demographics from Tasy REST API
   */
  async getPatientDemographics(patientId: string): Promise<any> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ patientId }, 'Fetching patient demographics from Tasy API');

      const response = await this.apiClient.get(`/patients/${patientId}`);

      this.logger.debug({ patientId }, 'Patient demographics retrieved');

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve patient demographics: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Query procedure codes (TUSS table) from Tasy API
   */
  async queryProcedureCodes(query: string): Promise<any[]> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ query }, 'Querying TUSS codes from Tasy API');

      const response = await this.apiClient.get('/procedures', {
        params: { q: query },
      });

      this.logger.debug({ query, count: response.data.length }, 'TUSS codes retrieved');

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to query procedure codes: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Get patient by CPF from Tasy REST API
   */
  async getPatient(cpf: string): Promise<any> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ cpf }, 'Fetching patient from Tasy API');

      const response = await this.apiClient.get('/patients/search', {
        params: { cpf },
      });

      this.logger.debug({ cpf }, 'Patient retrieved');

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve patient: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Get visit details from Tasy REST API
   */
  async getVisit(visitId: string): Promise<any> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ visitId }, 'Fetching visit from Tasy API');

      const response = await this.apiClient.get(`/visits/${visitId}`);

      this.logger.debug({ visitId }, 'Visit retrieved');

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve visit: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Get orders for a visit from Tasy REST API
   */
  async getOrders(visitId: string): Promise<any[]> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ visitId }, 'Fetching orders from Tasy API');

      const response = await this.apiClient.get(`/visits/${visitId}/orders`);

      this.logger.debug({ visitId, count: response.data.length }, 'Orders retrieved');

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve orders: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Post lab result to Tasy REST API
   */
  async postResult(result: any): Promise<void> {
    if (!this.apiClient) {
      throw this.createError('Tasy REST API not configured', 'API_NOT_CONFIGURED', false);
    }

    try {
      this.logger.debug({ resultId: result.id }, 'Posting result to Tasy API');

      await this.apiClient.post('/results', result);

      this.logger.debug({ resultId: result.id }, 'Result posted');
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to post result: ${(error as Error).message}`,
        'API_ERROR',
        true
      );
    }
  }

  /**
   * Parse Z-segments from received HL7 message
   */
  parseZSegments(hl7Message: string): Record<string, TasyZSegment> {
    const segments = hl7Message.split('\r');
    const zSegments: Record<string, TasyZSegment> = {};

    for (const segment of segments) {
      if (segment.startsWith('Z')) {
        const fields = segment.split('|');
        const name = fields[0];
        const segmentFields: Record<string, string> = {};

        // Parse fields based on segment type
        if (name === 'ZPD') {
          segmentFields.motherName = fields[1] || '';
          segmentFields.birthPlace = fields[2] || '';
          segmentFields.nationality = fields[3] || '';
          segmentFields.rg = fields[4] || '';
          segmentFields.cpf = fields[5] || '';
          segmentFields.cns = fields[6] || '';
          segmentFields.occupation = fields[7] || '';
          segmentFields.educationLevel = fields[8] || '';
        } else if (name === 'ZPV') {
          segmentFields.visitNumber = fields[1] || '';
          segmentFields.admissionType = fields[2] || '';
          segmentFields.serviceType = fields[3] || '';
          segmentFields.bedNumber = fields[4] || '';
          segmentFields.wardCode = fields[5] || '';
          segmentFields.attendingPhysician = fields[6] || '';
          segmentFields.admissionDate = fields[7] || '';
          segmentFields.dischargeDate = fields[8] || '';
        } else if (name === 'ZIN') {
          segmentFields.planCode = fields[1] || '';
          segmentFields.planName = fields[2] || '';
          segmentFields.cardNumber = fields[3] || '';
          segmentFields.validityStart = fields[4] || '';
          segmentFields.validityEnd = fields[5] || '';
          segmentFields.holderName = fields[6] || '';
          segmentFields.relationship = fields[7] || '';
        } else if (name === 'ZOR') {
          segmentFields.orderNumber = fields[1] || '';
          segmentFields.orderType = fields[2] || '';
          segmentFields.priority = fields[3] || '';
          segmentFields.requestingPhysician = fields[4] || '';
          segmentFields.orderDate = fields[5] || '';
          segmentFields.clinicalIndication = fields[6] || '';
          segmentFields.tussCode = fields[7] || '';
        } else if (name === 'ZOB') {
          // ZOB - Observation/Result Data
          segmentFields.observationId = fields[1] || '';
          segmentFields.observationType = fields[2] || '';
          segmentFields.observationValue = fields[3] || '';
          segmentFields.units = fields[4] || '';
          segmentFields.referenceRange = fields[5] || '';
          segmentFields.abnormalFlags = fields[6] || '';
          segmentFields.observationStatus = fields[7] || '';
          segmentFields.observationDate = fields[8] || '';
        }

        zSegments[name] = { name, fields: segmentFields };
      }
    }

    return zSegments;
  }
}

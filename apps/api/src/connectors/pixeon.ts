/**
 * S22 - Pixeon Connector
 *
 * Connector for Pixeon PACS/RIS systems.
 * Supports HL7 for RIS integration and DICOMweb for PACS image access.
 */

import axios, { AxiosInstance } from "axios";
import { GenericHL7Connector } from "./generic-hl7.js";
import type { PixeonConfig, ConnectorMessage } from "../types/connector.js";
import type { BaseConnectorConfig } from "./base.js";

interface PixeonConnectorConfig extends BaseConnectorConfig {
  config: PixeonConfig;
}

interface DICOMStudy {
  studyInstanceUID: string;
  studyDate: string;
  studyTime?: string;
  accessionNumber?: string;
  patientID: string;
  patientName?: string;
  modality?: string;
  studyDescription?: string;
  numberOfInstances?: number;
  series?: DICOMSeries[];
}

interface DICOMSeries {
  seriesInstanceUID: string;
  seriesNumber?: string;
  modality?: string;
  seriesDescription?: string;
  numberOfInstances?: number;
}

interface DICOMInstance {
  sopInstanceUID: string;
  sopClassUID: string;
  instanceNumber?: string;
}

interface StudySearchParams {
  patientID?: string;
  patientName?: string;
  accessionNumber?: string;
  studyDate?: string;
  modality?: string;
  studyInstanceUID?: string;
}

export class PixeonConnector extends GenericHL7Connector {
  private pixeonConfig: PixeonConfig;
  private dicomWebClient: AxiosInstance;

  constructor(config: PixeonConnectorConfig) {
    super(config);
    this.pixeonConfig = config.config;

    // Initialize DICOMweb client
    this.dicomWebClient = this.createDicomWebClient();

    this.logger.info(
      { baseUrl: this.pixeonConfig.dicomWeb.baseUrl },
      "Pixeon DICOMweb client initialized",
    );
  }

  private createDicomWebClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.pixeonConfig.dicomWeb.baseUrl,
      timeout: this.hl7Config.timeout || 60000,
      headers: {
        Accept: "application/dicom+json",
        "Content-Type": "application/dicom+json",
      },
    });

    // Add authentication interceptor
    if (this.pixeonConfig.auth) {
      client.interceptors.request.use((config) => {
        const auth = this.pixeonConfig.auth!;

        switch (auth.type) {
          case "basic":
            if (auth.credentials.username && auth.credentials.password) {
              const token = Buffer.from(
                `${auth.credentials.username}:${auth.credentials.password}`,
              ).toString("base64");
              config.headers.Authorization = `Basic ${token}`;
            }
            break;

          case "bearer":
            if (auth.credentials.token) {
              config.headers.Authorization = `Bearer ${auth.credentials.token}`;
            }
            break;

          case "apikey":
            if (auth.credentials.key && auth.credentials.header) {
              config.headers[auth.credentials.header] = auth.credentials.key;
            }
            break;
        }

        return config;
      });
    }

    return client;
  }

  protected validateConfig(): void {
    super.validateConfig();

    if (!this.pixeonConfig.dicomWeb.baseUrl) {
      throw this.createError(
        "DICOMweb base URL is required",
        "INVALID_CONFIG",
        false,
      );
    }
  }

  /**
   * Send RIS order via HL7
   */
  async sendRisOrder(message: ConnectorMessage): Promise<void> {
    // Ensure message type is ORM (Order)
    if (!message.type.startsWith("ORM")) {
      throw this.createError(
        "Invalid message type for RIS order. Expected ORM^O01",
        "INVALID_MESSAGE_TYPE",
        false,
      );
    }

    // Send via parent HL7 connector
    await super.send(message);
  }

  /**
   * Search for DICOM studies using QIDO-RS
   */
  async searchStudies(params: StudySearchParams): Promise<DICOMStudy[]> {
    try {
      this.logger.debug({ params }, "Searching for DICOM studies");

      // Build query parameters
      const queryParams: Record<string, string> = {};

      if (params.patientID) {
        queryParams.PatientID = params.patientID;
      }
      if (params.patientName) {
        queryParams.PatientName = params.patientName;
      }
      if (params.accessionNumber) {
        queryParams.AccessionNumber = params.accessionNumber;
      }
      if (params.studyDate) {
        queryParams.StudyDate = params.studyDate;
      }
      if (params.modality) {
        queryParams.ModalitiesInStudy = params.modality;
      }
      if (params.studyInstanceUID) {
        queryParams.StudyInstanceUID = params.studyInstanceUID;
      }

      // Execute QIDO-RS query
      const qidoPath = this.pixeonConfig.dicomWeb.qidoPath || "/studies";
      const response = await this.dicomWebClient.get(qidoPath, {
        params: queryParams,
      });

      // Parse DICOM JSON response
      const studies = this.parseDicomJson(response.data);

      this.logger.debug({ count: studies.length }, "DICOM studies found");

      return studies;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to search DICOM studies: ${(error as Error).message}`,
        "QIDO_ERROR",
        true,
      );
    }
  }

  /**
   * Get study details with series information
   */
  async getStudyDetails(studyInstanceUID: string): Promise<DICOMStudy> {
    try {
      this.logger.debug({ studyInstanceUID }, "Getting study details");

      // Query study metadata
      const qidoPath = this.pixeonConfig.dicomWeb.qidoPath || "/studies";
      const studyPath = `${qidoPath}/${studyInstanceUID}/series`;

      const response = await this.dicomWebClient.get(studyPath);

      const series = this.parseDicomSeriesJson(response.data);

      // Build study object
      const study: DICOMStudy = {
        studyInstanceUID,
        studyDate: "",
        patientID: "",
        series,
      };

      this.logger.debug(
        { studyInstanceUID, seriesCount: series.length },
        "Study details retrieved",
      );

      return study;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to get study details: ${(error as Error).message}`,
        "QIDO_ERROR",
        true,
      );
    }
  }

  /**
   * Retrieve DICOM image using WADO-RS
   */
  async retrieveInstance(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
  ): Promise<Buffer> {
    try {
      this.logger.debug(
        { studyInstanceUID, seriesInstanceUID, sopInstanceUID },
        "Retrieving DICOM instance",
      );

      const wadoPath = this.pixeonConfig.dicomWeb.wadoPath || "/studies";
      const instancePath = `${wadoPath}/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}`;

      const response = await this.dicomWebClient.get(instancePath, {
        responseType: "arraybuffer",
        headers: {
          Accept: "application/dicom",
        },
      });

      this.logger.debug(
        { sopInstanceUID, size: response.data.length },
        "DICOM instance retrieved",
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve DICOM instance: ${(error as Error).message}`,
        "WADO_ERROR",
        true,
      );
    }
  }

  /**
   * Retrieve study as ZIP archive
   */
  async retrieveStudyArchive(studyInstanceUID: string): Promise<Buffer> {
    try {
      this.logger.debug({ studyInstanceUID }, "Retrieving study archive");

      const wadoPath = this.pixeonConfig.dicomWeb.wadoPath || "/studies";
      const studyPath = `${wadoPath}/${studyInstanceUID}`;

      const response = await this.dicomWebClient.get(studyPath, {
        responseType: "arraybuffer",
        headers: {
          Accept: "application/zip",
        },
      });

      this.logger.debug(
        { studyInstanceUID, size: response.data.length },
        "Study archive retrieved",
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve study archive: ${(error as Error).message}`,
        "WADO_ERROR",
        true,
      );
    }
  }

  /**
   * Get image thumbnail/preview
   */
  async getImageThumbnail(
    studyInstanceUID: string,
    seriesInstanceUID: string,
    sopInstanceUID: string,
  ): Promise<Buffer> {
    try {
      this.logger.debug(
        { studyInstanceUID, seriesInstanceUID, sopInstanceUID },
        "Retrieving image thumbnail",
      );

      const wadoPath = this.pixeonConfig.dicomWeb.wadoPath || "/studies";
      const thumbnailPath = `${wadoPath}/${studyInstanceUID}/series/${seriesInstanceUID}/instances/${sopInstanceUID}/thumbnail`;

      const response = await this.dicomWebClient.get(thumbnailPath, {
        responseType: "arraybuffer",
        headers: {
          Accept: "image/jpeg",
        },
      });

      this.logger.debug(
        { sopInstanceUID, size: response.data.length },
        "Image thumbnail retrieved",
      );

      return Buffer.from(response.data);
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to retrieve image thumbnail: ${(error as Error).message}`,
        "WADO_ERROR",
        true,
      );
    }
  }

  /**
   * Parse DICOM JSON to study objects
   */
  private parseDicomJson(dicomJson: any[]): DICOMStudy[] {
    return dicomJson.map((item) => ({
      studyInstanceUID: this.extractDicomValue(item, "0020000D") || "",
      studyDate: this.extractDicomValue(item, "00080020") || "",
      studyTime: this.extractDicomValue(item, "00080030"),
      accessionNumber: this.extractDicomValue(item, "00080050"),
      patientID: this.extractDicomValue(item, "00100020") || "",
      patientName: this.extractDicomValue(item, "00100010"),
      modality: this.extractDicomValue(item, "00080061"),
      studyDescription: this.extractDicomValue(item, "00081030"),
      numberOfInstances: parseInt(
        this.extractDicomValue(item, "00201208") || "0",
      ),
    }));
  }

  /**
   * Parse DICOM JSON to series objects
   */
  private parseDicomSeriesJson(dicomJson: any[]): DICOMSeries[] {
    return dicomJson.map((item) => ({
      seriesInstanceUID: this.extractDicomValue(item, "0020000E") || "",
      seriesNumber: this.extractDicomValue(item, "00200011"),
      modality: this.extractDicomValue(item, "00080060"),
      seriesDescription: this.extractDicomValue(item, "0008103E"),
      numberOfInstances: parseInt(
        this.extractDicomValue(item, "00201209") || "0",
      ),
    }));
  }

  /**
   * Extract value from DICOM JSON attribute
   */
  private extractDicomValue(obj: any, tag: string): string | undefined {
    const attr = obj[tag];
    if (!attr) return undefined;

    // DICOM JSON format can have Value array or InlineBinary
    if (attr.Value && attr.Value.length > 0) {
      const value = attr.Value[0];
      // Handle Person Name (PN) value representation
      if (typeof value === "object" && value.Alphabetic) {
        return value.Alphabetic;
      }
      return String(value);
    }

    return undefined;
  }

  /**
   * Send study status update via HL7
   */
  async sendStatusUpdate(message: ConnectorMessage): Promise<void> {
    // Ensure message type is ORU (Observation Result)
    if (!message.type.startsWith("ORU")) {
      throw this.createError(
        "Invalid message type for status update. Expected ORU^R01",
        "INVALID_MESSAGE_TYPE",
        false,
      );
    }

    await super.send(message);
  }

  /**
   * Query worklist (Modality Worklist - MWL)
   */
  async queryWorklist(params: any): Promise<any[]> {
    try {
      this.logger.debug({ params }, "Querying DICOM worklist");

      // MWL queries are typically done via DIMSE protocol, not DICOMweb
      // This is a placeholder for potential REST API implementation
      const response = await this.dicomWebClient.get("/worklist", {
        params,
      });

      return response.data;
    } catch (error) {
      this.recordError(error as Error);
      throw this.createError(
        `Failed to query worklist: ${(error as Error).message}`,
        "MWL_ERROR",
        true,
      );
    }
  }
}

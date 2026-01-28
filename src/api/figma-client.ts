import axios, { AxiosInstance } from 'axios';
import { GetFileResponse, GetFileNodesResponse, GetImagesResponse } from './figma-api-types';

// Figma REST API base URL
const FIGMA_API_BASE = 'https://api.figma.com/v1';

export class FigmaClient {
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.client = axios.create({
      baseURL: FIGMA_API_BASE,
      headers: {
        'X-Figma-Token': accessToken,
        'User-Agent': 'Figma-Code-Generator',
      },
    });
  }

  /**
   * Get a Figma file's full JSON representation
   * @param fileKey - The Figma file key (from file URL)
   * @param options - Optional query parameters
   */
  async getFile(
    fileKey: string,
    options: {
      version?: string;
      ids?: string[];
      depth?: number;
      geometry?: 'paths';
      pluginData?: string;
    } = {}
  ): Promise<GetFileResponse> {
    const params: Record<string, string> = {};

    if (options.version) params.version = options.version;
    if (options.ids) params.ids = options.ids.join(',');
    if (options.depth) params.depth = options.depth.toString();
    if (options.geometry) params.geometry = options.geometry;
    if (options.pluginData) params.plugin_data = options.pluginData;

    const response = await this.client.get(`/files/${fileKey}`, { params });
    return response.data;
  }

  /**
   * Get specific nodes from a Figma file
   * @param fileKey - The Figma file key
   * @param nodeIds - Array of node IDs to retrieve
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[],
    options: {
      version?: string;
      depth?: number;
      geometry?: 'paths';
      pluginData?: string;
    } = {}
  ): Promise<GetFileNodesResponse> {
    const params: Record<string, string> = {
      ids: nodeIds.join(','),
    };

    if (options.version) params.version = options.version;
    if (options.depth) params.depth = options.depth.toString();
    if (options.geometry) params.geometry = options.geometry;
    if (options.pluginData) params.plugin_data = options.pluginData;

    const response = await this.client.get(`/files/${fileKey}/nodes`, { params });
    return response.data;
  }

  /**
   * Render images of specific nodes
   * @param fileKey - The Figma file key
   * @param nodeIds - Array of node IDs to render
   * @param options - Render options
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: {
      scale?: number;
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      svgOutlineText?: boolean;
      svgIncludeId?: boolean;
      svgIncludeNodeId?: boolean;
      version?: string;
    } = {}
  ): Promise<GetImagesResponse> {
    const params: Record<string, string | number | boolean> = {
      ids: nodeIds.join(','),
    };

    if (options.scale) params.scale = options.scale;
    if (options.format) params.format = options.format;
    if (options.svgOutlineText !== undefined) params.svg_outline_text = options.svgOutlineText;
    if (options.svgIncludeId !== undefined) params.svg_include_id = options.svgIncludeId;
    if (options.svgIncludeNodeId !== undefined) params.svg_include_node_id = options.svgIncludeNodeId;
    if (options.version) params.version = options.version;

    const response = await this.client.get(`/images/${fileKey}`, { params });
    return response.data;
  }

  /**
   * Get download URLs for images embedded in a file
   * @param fileKey - The Figma file key
   */
  async getImageFills(fileKey: string): Promise<{ images: Record<string, string> }> {
    const response = await this.client.get(`/files/${fileKey}/images`);
    return response.data;
  }

  /**
   * Get file metadata
   * @param fileKey - The Figma file key
   */
  async getFileMeta(fileKey: string): Promise<{
    file: {
      name: string;
      lastModified: string;
      thumbnailUrl: string;
      version: string;
    };
  }> {
    const response = await this.client.get(`/files/${fileKey}/meta`);
    return response.data;
  }
}

// Helper function to extract file key from URL
export function extractFileKey(figmaUrl: string): string | null {
  // Figma URL formats:
  // https://www.figma.com/file/FILE_KEY/File-Name
  // https://www.figma.com/design/FILE_KEY/File-Name
  // https://www.figma.com/file/FILE_KEY/File-Name?node-id=0:1
  
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
    /figma\.com\/[a-zA-Z]+\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = figmaUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Helper function to extract node ID from URL
export function extractNodeId(figmaUrl: string): string | null {
  // URL format: ...?node-id=NODE_ID
  // Node ID format: 1:123 or 1-2:3-4
  
  const match = figmaUrl.match(/node-id=([^&]+)/);
  if (match) {
    return match[1].replace(':', ':');
  }

  return null;
}

// Helper function to create client from environment
export function createClient(): FigmaClient {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN is not set in environment variables');
  }
  return new FigmaClient(token);
}

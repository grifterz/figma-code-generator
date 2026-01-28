import { FigmaClient } from './figma-client';
import { FigmaResponse, Node as FigmaNode, GetFileResponse } from './figma-api-types';
import { 
  ParsedDocument, 
  ParsedPage, 
  FrameNode, 
  TextNode, 
  RectangleNode,
  VectorNode,
  EllipseNode,
  ComponentNode,
  InstanceNode,
  BaseNode,
  DesignTokens,
  Color,
} from '../types/figma-node';
import { NodeTransformer } from './node-transformer';

export class FigmaParser {
  private client: FigmaClient;
  private transformer: NodeTransformer;

  constructor(accessToken: string) {
    this.client = new FigmaClient(accessToken);
    this.transformer = new NodeTransformer();
  }

  /**
   * Parse a Figma file and return a structured document
   * @param fileKey - The Figma file key
   */
  async parseFile(fileKey: string): Promise<ParsedDocument> {
    const response = await this.client.getFile(fileKey);
    
    if (response.err) {
      throw new Error(`Figma API error: ${response.err}`);
    }

    return this.parseDocument(response);
  }

  /**
   * Parse a specific node from a Figma file
   * @param fileKey - The Figma file key
   * @param nodeId - The node ID to parse
   */
  async parseNode(fileKey: string, nodeId: string): Promise<BaseNode> {
    const response = await this.client.getFileNodes(fileKey, [nodeId]);
    
    const nodeData = response.nodes[nodeId];
    if (!nodeData) {
      throw new Error(`Node ${nodeId} not found in file`);
    }

    return this.transformer.transform(nodeData.document);
  }

  /**
   * Parse multiple nodes from a Figma file
   * @param fileKey - The Figma file key
   * @param nodeIds - Array of node IDs to parse
   */
  async parseNodes(fileKey: string, nodeIds: string[]): Promise<BaseNode[]> {
    const response = await this.client.getFileNodes(fileKey, nodeIds);
    const results: BaseNode[] = [];

    for (const nodeId of nodeIds) {
      const nodeData = response.nodes[nodeId];
      if (nodeData) {
        results.push(this.transformer.transform(nodeData.document));
      }
    }

    return results;
  }

  /**
   * Extract design tokens (colors, text styles, effects) from a file
   * @param fileKey - The Figma file key
   */
  async extractTokens(fileKey: string): Promise<DesignTokens> {
    const response = await this.client.getFile(fileKey);
    
    const tokens: DesignTokens = {
      colors: {},
      textStyles: {},
      effects: {},
    };

    // Process style definitions
    for (const [styleId, style] of Object.entries(response.styles || {})) {
      if (style.styleType === 'FILL') {
        // Colors would be extracted from nodes using this style
        tokens.colors[style.name] = { r: 0, g: 0, b: 0, a: 1 }; // Placeholder
      } else if (style.styleType === 'TEXT') {
        tokens.textStyles[style.name] = {
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 400,
        };
      } else if (style.styleType === 'EFFECT') {
        tokens.effects[style.name] = { type: 'DROP_SHADOW' };
      }
    }

    return tokens;
  }

  /**
   * Render node images (for complex vectors/shapes)
   * @param fileKey - The Figma file key
   * @param nodeIds - Array of node IDs to render
   * @param format - Image format (default: svg)
   */
  async renderImages(
    fileKey: string, 
    nodeIds: string[], 
    format: 'svg' | 'png' | 'jpg' = 'svg'
  ): Promise<Record<string, string>> {
    const response = await this.client.getImages(fileKey, nodeIds, {
      format,
      scale: 2,
    });

    return response.images as Record<string, string>;
  }

  private parseDocument(response: GetFileResponse): ParsedDocument {
    const document = response.document;
    
    // Parse pages (canvases)
    const pages: ParsedPage[] = [];
    
    if (document.type === 'DOCUMENT') {
      for (const canvas of document.children) {
        const page = this.parseCanvas(canvas);
        if (page.frames.length > 0) {
          pages.push(page);
        }
      }
    }

    // Parse components
    const components: Record<string, ComponentNode> = {};
    for (const [id, component] of Object.entries(response.components || {})) {
      // Components are stored by ID, we'd need to find them in the document
      // This is a simplified version
      components[id] = {
        id,
        name: component.name,
        type: 'COMPONENT',
        children: [],
      };
    }

    // Parse styles
    const styles: Record<string, { name: string; type: string }> = {};
    for (const [id, style] of Object.entries(response.styles || {})) {
      styles[id] = {
        name: style.name,
        type: style.styleType,
      };
    }

    return {
      name: response.name,
      lastModified: response.lastModified,
      version: response.version,
      components,
      styles,
      pages,
    };
  }

  private parseCanvas(canvas: any): ParsedPage {
    const frames: FrameNode[] = [];

    if (canvas.type === 'CANVAS') {
      for (const child of canvas.children || []) {
        const parsed = this.transformer.transform(child);
        if (parsed.type === 'FRAME') {
          frames.push(parsed as FrameNode);
        }
      }
    }

    return {
      id: canvas.id,
      name: canvas.name,
      frames,
    };
  }
}

export function createParser(): FigmaParser {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN is not set');
  }
  return new FigmaParser(token);
}

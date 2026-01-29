import { FigmaClient } from '../api/figma-client';
import { FigmaResponse, Node as FigmaNode, GetFileResponse, Style } from '../api/figma-api-types';
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
  DesignStyle,
} from '../types/figma-node';
import { NodeTransformer } from '../transformers/node-transformer';

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
      const figmaStyle = style as { key: string; name: string; styleType: string };
      if (figmaStyle.styleType === 'FILL') {
        // Colors would be extracted from nodes using this style
        tokens.colors[figmaStyle.name] = { r: 0, g: 0, b: 0, a: 1 }; // Placeholder
      } else if (figmaStyle.styleType === 'TEXT') {
        tokens.textStyles[figmaStyle.name] = {
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 400,
        };
      } else if (figmaStyle.styleType === 'EFFECT') {
        tokens.effects[figmaStyle.name] = { type: 'DROP_SHADOW' };
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
      const figmaComponent = component as { key: string; name: string; description: string };
      components[id] = {
        id,
        name: figmaComponent.name,
        type: 'COMPONENT',
        children: [],
      };
    }

    // Parse styles
    const styles: Record<string, DesignStyle> = {};
    for (const [id, style] of Object.entries(response.styles || {})) {
      const figmaStyle = style as Style;
      styles[id] = {
        key: figmaStyle.key,
        name: figmaStyle.name,
        type: figmaStyle.styleType,
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

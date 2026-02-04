/**
 * Figma API Client with Caching
 * 
 * Purpose: Fetch Figma designs with caching to avoid API rate limits.
 * 
 * Caching Strategy:
 * - In-memory cache for duration of serverless function
 * - For persistent caching, would need Vercel KV/Blob
 * - This implementation caches during development sessions
 * 
 * Rate Limit Strategy:
 * - Cache results in memory during session
 * - Works within single deployment instance
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// IN-MEMORY CACHE (per-serverless-instance)
// Note: For persistent caching across instances, use Vercel KV or Blob
// ============================================================================

interface CacheEntry {
  data: any;
  timestamp: number;
  maxAge: number; // milliseconds
}

// In-memory cache - resets on cold starts
const cache = new Map<string, CacheEntry>();
const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour

function getFromCache(fileKey: string): any | null {
  const entry = cache.get(fileKey);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.maxAge) {
    cache.delete(fileKey);
    return null;
  }
  
  return entry.data;
}

function saveToCache(fileKey: string, data: any): void {
  cache.set(fileKey, {
    data,
    timestamp: Date.now(),
    maxAge: CACHE_MAX_AGE,
  });
}

// ============================================================================
// FIGMA API TYPES
// Simplified types for our renderer - expand as needed
// ============================================================================

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  opacity?: number;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  characters?: string;
  style?: FigmaTextStyle;
}

interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: { r: number; g: number; b: number; a: number };
  opacity?: number;
  visible?: boolean;
}

interface FigmaStroke {
  type: string;
  color?: { r: number; g: number; b: number; a: number };
}

interface FigmaTextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  lineHeightPx?: number;
}

interface FigmaFile {
  name: string;
  lastModified: string;
  document: {
    children: FigmaNode[];
  };
}

/**
 * Extract file key from Figma URL
 * Handles formats: 
 * - https://www.figma.com/file/{key}/...
 * - https://www.figma.com/design/{key}/...
 */
function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extract node ID from Figma URL
 * Format: ?node-id=123:456
 */
function extractNodeId(url: string): string | null {
  const match = url.match(/node-id=([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Convert Figma color to CSS rgba string
 */
function colorToCSS(color?: { r: number; g: number; b: number; a: number }): string {
  if (!color) return 'transparent';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

// ============================================================================
// RENDERER - Converts Figma Node Tree to HTML/CSS
// This is the core renderer - expand this module for more features
// ============================================================================

/**
 * Generate CSS for a single node
 */
function generateNodeCSS(node: FigmaNode, indent: number = 0): string {
  const lines: string[] = [];
  const className = `node-${node.id.replace(/:/g, '-')}`;
  
  // Base positioning
  if (node.absoluteBoundingBox) {
    lines.push(`  position: absolute;`);
    lines.push(`  left: ${node.absoluteBoundingBox.x}px;`);
    lines.push(`  top: ${node.absoluteBoundingBox.y}px;`);
    lines.push(`  width: ${node.absoluteBoundingBox.width}px;`);
    lines.push(`  height: ${node.absoluteBoundingBox.height}px;`);
  }
  
  // Background color
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      lines.push(`  background-color: ${colorToCSS(fill.color)};`);
    }
  }
  
  // Border
  if (node.strokeWeight && node.strokes && node.strokes.length > 0) {
    lines.push(`  border: ${node.strokeWeight}px solid ${colorToCSS(node.strokes[0].color)};`);
  }
  
  // Corner radius
  if (node.cornerRadius) {
    lines.push(`  border-radius: ${node.cornerRadius}px;`);
  }
  
  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    lines.push(`  opacity: ${node.opacity};`);
  }
  
  // Text styles
  if (node.type === 'TEXT' && node.style) {
    if (node.style.fontFamily) {
      lines.push(`  font-family: ${node.style.fontFamily};`);
    }
    if (node.style.fontSize) {
      lines.push(`  font-size: ${node.style.fontSize}px;`);
    }
    if (node.style.fontWeight) {
      lines.push(`  font-weight: ${node.style.fontWeight};`);
    }
    if (node.style.textAlignHorizontal) {
      lines.push(`  text-align: ${node.style.textAlignHorizontal.toLowerCase()};`);
    }
  }
  
  return `.${className} {\n${lines.map(l => '  ' + l).join('\n')}\n}`;
}

/**
 * Generate HTML for a single node
 */
function generateNodeHTML(node: FigmaNode): string {
  const className = `node-${node.id.replace(/:/g, '-')}`;
  let html = `<div class="${className}">`;
  
  // Add text content
  if (node.type === 'TEXT' && node.characters) {
    html += node.characters;
  }
  
  // Add children
  if (node.children && node.children.length > 0) {
    html += node.children.map(child => generateNodeHTML(child)).join('');
  }
  
  html += `</div>`;
  return html;
}

/**
 * Generate complete HTML document from Figma node
 */
function renderToHTML(rootNode: FigmaNode): { html: string; css: string } {
  // Generate CSS for all nodes
  const cssLines = [
    `/* Figma Design Render */`,
    `* { box-sizing: border-box; margin: 0; padding: 0; }`,
    `body { font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }`,
    `.figma-container { position: relative; width: 100%; min-height: 100vh; }`,
  ];
  
  function collectCSS(node: FigmaNode) {
    cssLines.push(generateNodeCSS(node));
    if (node.children) {
      node.children.forEach(collectCSS);
    }
  }
  
  collectCSS(rootNode);
  
  // Generate HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Figma Render</title>
  <style>
${cssLines.join('\n\n')}
  </style>
</head>
<body>
  <div class="figma-container">
${generateNodeHTML(rootNode).replace(/^/gm, '    ')}
  </div>
</body>
</html>`;
  
  return {
    html,
    css: cssLines.join('\n\n'),
  };
}

// ============================================================================
// MAIN API ROUTE HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const fileKey = extractFileKey(url);
    if (!fileKey) {
      return NextResponse.json(
        { error: 'Invalid Figma URL. Could not extract file key.' },
        { status: 400 }
      );
    }

    const nodeId = extractNodeId(url);

    // Check cache first (no API call)
    let figmaData: FigmaFile | null = null;
    let fromCache = false;

    const cached = getFromCache(fileKey);
    if (cached) {
      console.log(`[CACHE] Loading ${fileKey} from memory cache`);
      figmaData = cached;
      fromCache = true;
    }

    // Fetch from Figma API if not cached
    if (!figmaData) {
      const token = process.env.FIGMA_ACCESS_TOKEN;
      if (!token) {
        return NextResponse.json(
          { error: 'FIGMA_ACCESS_TOKEN is not configured' },
          { status: 500 }
        );
      }

      console.log(`[API] Fetching from Figma: ${fileKey}`);
      const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': token,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API ERROR] ${response.status}: ${errorText}`);
        return NextResponse.json(
          { error: `Figma API Error: ${response.status}` },
          { status: response.status }
        );
      }

      figmaData = await response.json();
      
      // Save to cache
      saveToCache(fileKey, figmaData);
      console.log(`[CACHE] Saved ${fileKey} to memory cache`);
    }

    // Get the target node (first canvas, then specified node or first frame)
    const canvas = figmaData.document.children[0];
    const targetNode = nodeId 
      ? findNodeById(figmaData.document, nodeId)
      : canvas?.children?.[0];

    if (!targetNode || !canvas) {
      return NextResponse.json(
        { error: 'No frames found in the Figma file' },
        { status: 400 }
      );
    }

    // Render to HTML/CSS
    const { html, css } = renderToHTML(targetNode);

    console.log(`[RENDER] Generated ${html.length} bytes HTML, ${css.length} bytes CSS`);
    console.log(`[SOURCE] ${fromCache ? 'CACHE' : 'API'}`);

    return NextResponse.json({
      web: { html, css },
      source: fromCache ? 'cache' : 'api',
      cachedAt: fromCache ? new Date().toISOString() : null,
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Find a node by ID in the Figma document tree
 */
function findNodeById(node: any, id: string): FigmaNode | null {
  if (node.id === id) return node as FigmaNode;
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

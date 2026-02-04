import { NextRequest, NextResponse } from 'next/server';

// Simple Figma API types
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
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  characters?: string;
  style?: any;
}

interface FigmaResponse {
  name: string;
  document: { children: FigmaNode[] };
}

// Extract file key from URL
function extractFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Color to CSS
function colorToCSS(color: { r: number; g: number; b: number; a: number } | undefined): string {
  if (!color) return 'transparent';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

// Simple node to HTML/CSS
function nodeToHTML(node: FigmaNode, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  const className = `node-${node.id.replace(/:/g, '-')}`;
  
  let styles: string[] = [];
  
  if (node.absoluteBoundingBox) {
    styles.push(`position: absolute`);
    styles.push(`left: ${node.absoluteBoundingBox.x}px`);
    styles.push(`top: ${node.absoluteBoundingBox.y}px`);
    styles.push(`width: ${node.absoluteBoundingBox.width}px`);
    styles.push(`height: ${node.absoluteBoundingBox.height}px`);
  }
  
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      styles.push(`background-color: ${colorToCSS(fill.color)}`);
    }
  }
  
  if (node.strokeWeight && node.strokes?.length) {
    styles.push(`border: ${node.strokeWeight}px solid ${colorToCSS(node.strokes[0].color)}`);
  }
  
  if (node.cornerRadius) {
    styles.push(`border-radius: ${node.cornerRadius}px`);
  }

  let html = `${indent}<div class="${className}" style="${styles.join('; ')}">\n`;
  
  if (node.type === 'TEXT' && node.characters) {
    html += `${indent}  ${node.characters}\n`;
  } else if (node.children) {
    html += node.children.map(child => nodeToHTML(child, depth + 1)).join('\n');
    html += '\n';
  }
  
  html += `${indent}</div>`;
  return html;
}

// Generate CSS
function generateCSS(nodes: FigmaNode[]): string {
  let css = `/* Figma Design Export */\n\n`;
  css += `.figma-container {\n  position: relative;\n  width: 100%;\n  min-height: 100vh;\n}\n\n`;
  
  function addNodeStyles(node: FigmaNode) {
    const className = `.node-${node.id.replace(/:/g, '-')}`;
    
    let styles: string[] = [];
    
    if (node.absoluteBoundingBox) {
      styles.push(`  position: absolute`);
      styles.push(`  left: ${node.absoluteBoundingBox.x}px`);
      styles.push(`  top: ${node.absoluteBoundingBox.y}px`);
      styles.push(`  width: ${node.absoluteBoundingBox.width}px`);
      styles.push(`  height: ${node.absoluteBoundingBox.height}px`);
    }
    
    if (node.opacity !== undefined && node.opacity < 1) {
      styles.push(`  opacity: ${node.opacity}`);
    }
    
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.push(`  background-color: ${colorToCSS(fill.color)}`);
      }
    }
    
    if (node.strokeWeight && node.strokes?.length) {
      styles.push(`  border: ${node.strokeWeight}px solid ${colorToCSS(node.strokes[0].color)}`);
      styles.push(`  border-style: solid`);
    }
    
    if (node.cornerRadius) {
      styles.push(`  border-radius: ${node.cornerRadius}px`);
    }
    
    if (node.type === 'TEXT') {
      styles.push(`  display: flex`);
      styles.push(`  align-items: center`);
      if (node.style) {
        styles.push(`  font-family: ${node.style.fontFamily || 'Arial'}`);
        styles.push(`  font-size: ${node.style.fontSize || 14}px`);
        styles.push(`  font-weight: ${node.style.fontWeight || 400}`);
      }
      if (node.fills?.[0]?.color) {
        styles.push(`  color: ${colorToCSS(node.fills[0].color)}`);
      }
    }
    
    if (styles.length > 0) {
      css += `${className} {\n${styles.join(';\n')}\n}\n\n`;
    }
    
    if (node.children) {
      node.children.forEach(addNodeStyles);
    }
  }
  
  nodes.forEach(addNodeStyles);
  return css;
}

// Node to SwiftUI
function nodeToSwift(node: FigmaNode, name: string, depth: number = 0): string {
  const indent = '  '.repeat(depth);
  
  let modifiers: string[] = [];
  
  if (node.absoluteBoundingBox) {
    modifiers.push(`${indent}  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
  }
  
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const c = fill.color;
      modifiers.push(`${indent}  .background(Color(red: ${c.r.toFixed(3)}, green: ${c.g.toFixed(3)}, blue: ${c.b.toFixed(3)}))`);
    }
  }
  
  if (node.cornerRadius) {
    modifiers.push(`${indent}  .cornerRadius(${node.cornerRadius})`);
  }
  
  if (node.type === 'TEXT') {
    let view = `${indent}Text("${node.characters?.replace(/"/g, '\\"') || ''}")`;
    if (node.style) {
      view += `\n${indent}  .font(.system(size: ${node.style.fontSize || 14}, weight: ${node.style.fontWeight >= 700 ? '.bold' : '.regular'}))`;
    }
    return view + modifiers.join('\n');
  }
  
  if (node.children && node.children.length > 0) {
    const childViews = node.children.map((child, i) => 
      nodeToSwift(child, child.name || `Child${i}`, depth + 1)
    ).join('\n');
    
    return `${indent}${name} {\n${childViews}\n${indent}}${modifiers.join('\n')}`;
  }
  
  return `${indent}${name}${modifiers.join('')}`;
}

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

    const token = process.env.FIGMA_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'FIGMA_ACCESS_TOKEN is not configured' },
        { status: 500 }
      );
    }

    // Fetch from Figma API
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Figma API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Figma API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const figmaData: FigmaResponse = await response.json();
    
    // Get first canvas and first frame
    const canvas = figmaData.document.children[0];
    const frame = canvas?.children?.[0];

    if (!frame) {
      return NextResponse.json(
        { error: 'No frames found in the Figma file' },
        { status: 400 }
      );
    }

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Design Export</title>
  <style>
${generateCSS([frame])}
  </style>
</head>
<body>
  <div class="figma-container">
${nodeToHTML(frame, 2)}
  </div>
</body>
</html>`;

    // Generate Swift
    const swift = `import SwiftUI

struct FigmaDesignView: View {
    var body: some View {
${nodeToSwift(frame, 'FigmaDesignView', 4)}
    }
}

#Preview {
    FigmaDesignView()
}
`;

    return NextResponse.json({
      web: {
        html,
        css: generateCSS([frame]),
      },
      swift,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

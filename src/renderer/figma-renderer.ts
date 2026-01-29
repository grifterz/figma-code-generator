// ============================================
// HIGH-FIDELITY FIGMA RENDERER
// Pixel-perfect CSS rendering of Figma designs
// ============================================

import { 
  BaseNode, 
  FrameNode, 
  TextNode, 
  RectangleNode,
  VectorNode,
  EllipseNode,
  ComponentNode,
  InstanceNode,
  Paint,
  Effect,
} from '../types/figma-node';
import {
  colorToRGBA,
  colorToHex,
  px,
  percent,
  flexDirection,
  flexWrap,
  justifyContent,
  alignItems,
  textAlign,
  textAlignVertical,
  textDecoration,
  textCase,
  cornerRadius,
  strokeWidth,
  paintToBackground,
  backgroundSize,
  effectsToCSS,
  backdropFilterToCSS,
  calculateLayout,
  getPrimaryFill,
  getPrimaryStroke,
  textStyleToCSS,
  isVisible,
  hasAutoLayout,
  LayoutResult,
} from './css-utils';

// ============================================
// NODE CLASS GENERATOR
// ============================================

interface GeneratedClass {
  selector: string;
  properties: Record<string, string>;
}

interface RenderedNode {
  html: string;
  css: string;
  classes: GeneratedClass[];
}

export class FigmaRenderer {
  private classCounter: number = 0;
  private classes: GeneratedClass[] = [];
  private generatedIds: Set<string> = new Set();

  /**
   * Generate HTML and CSS from a Figma node tree
   */
  render(node: BaseNode, options: { containerId?: string; includeContainer?: boolean } = {}): { html: string; css: string } {
    this.classCounter = 0;
    this.classes = [];
    this.generatedIds.clear();

    const containerId = options.containerId || 'figma-render';

    if (options.includeContainer !== false) {
      const result = this.renderNode(node, 'root');
      const containerCSS = this.generateContainerCSS(containerId);
      const allCSS = this.generateAllCSS() + '\n' + containerCSS;
      
      return {
        html: `<div id="${containerId}">\n${this.indent(result.html, 2)}\n</div>`,
        css: allCSS,
      };
    }

    const result = this.renderNode(node, 'root');
    return {
      html: result.html,
      css: this.generateAllCSS(),
    };
  }

  /**
   * Render a single node
   */
  private renderNode(node: BaseNode, baseName: string): RenderedNode {
    if (!isVisible(node)) {
      return { html: '', css: '', classes: [] };
    }

    const className = this.generateClassName(baseName);
    const layout = calculateLayout(node, undefined, undefined);
    const properties = this.nodeToCSSProperties(node, className, layout);
    
    // Register class
    this.classes.push({
      selector: `.${className}`,
      properties,
    });

    // Render children
    let childrenHTML = '';
    if (node.children && node.children.length > 0) {
      const childrenResults = node.children.map((child, index) => 
        this.renderNode(child, `${baseName}-${index}`)
      );
      
      childrenHTML = childrenResults.map(r => r.html).join('\n');
    }

    // Generate HTML
    const html = this.generateHTML(node, className, childrenHTML);

    return {
      html,
      css: '',
      classes: this.classes,
    };
  }

  /**
   * Generate CSS properties for a node
   */
  private nodeToCSSProperties(
    node: BaseNode, 
    className: string, 
    layout: LayoutResult
  ): Record<string, string> {
    const props: Record<string, string> = {};

    // Layout properties
    Object.assign(props, layout);

    // Position (if not auto-layout)
    if (!hasAutoLayout(node) && node.type !== 'GROUP') {
      if (node.absoluteBoundingBox) {
        props['position'] = 'absolute';
        props['top'] = px(node.absoluteBoundingBox.y);
        props['left'] = px(node.absoluteBoundingBox.x);
      }
    }

    // Size
    if (node.absoluteBoundingBox) {
      props['width'] = px(node.absoluteBoundingBox.width);
      props['height'] = px(node.absoluteBoundingBox.height);
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      props['opacity'] = node.opacity.toString();
    }

    // Background fill
    const fill = getPrimaryFill(node);
    if (fill) {
      props['background'] = paintToBackground(fill);
    }

    // Border/stroke
    const stroke = getPrimaryStroke(node);
    if (stroke) {
      props['border-style'] = 'solid';
      props['border-width'] = strokeWidth(node.strokeWeight, node.strokeAlign);
      props['border-color'] = paintToBackground(stroke);
    }

    // Corner radius
    if (node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'ELLIPSE') {
      const rect = node as RectangleNode | FrameNode | EllipseNode;
      if (rect.cornerRadius !== undefined || rect.rectangleCornerRadii) {
        props['border-radius'] = cornerRadius(
          rect.cornerRadius, 
          rect.rectangleCornerRadii as [number, number, number, number]
        );
      }
    }

    // Effects (shadows)
    if (node.effects && node.effects.length > 0) {
      props['box-shadow'] = effectsToCSS(node.effects);
    }

    // Backdrop blur
    if (node.effects && node.effects.some(e => e.type === 'BACKGROUND_BLUR')) {
      props['backdrop-filter'] = backdropFilterToCSS(node.effects);
    }

    // Blend mode
    if (node.blendMode && node.blendMode !== 'PASS_THROUGH') {
      props['mix-blend-mode'] = node.blendMode.toLowerCase().replace('_', '-');
    }

    // Overflow (for clipping)
    if (node.type === 'FRAME' && (node as FrameNode).clipsContent) {
      props['overflow'] = 'hidden';
    }

    // Text-specific properties
    if (node.type === 'TEXT') {
      const text = node as TextNode;
      
      // Text content
      if (text.characters) {
        // Content is rendered in the HTML element
      }
      
      // Text style
      if (text.style) {
        Object.assign(props, textStyleToCSS(text.style));
      }
      
      // Text fill color (handled by fills)
      const textFill = getPrimaryFill(text);
      if (textFill) {
        props['color'] = paintToBackground(textFill);
      }
      
      // Auto resize
      if (text.textAutoResize) {
        switch (text.textAutoResize) {
          case 'HEIGHT':
            props['height'] = 'auto';
            props['min-height'] = px(text.absoluteBoundingBox?.height);
            break;
          case 'WIDTH_AND_HEIGHT':
            props['width'] = 'auto';
            props['height'] = 'auto';
            break;
        }
      }
    }

    // Frame-specific auto-layout properties are already in layout

    return props;
  }

  /**
   * Generate HTML for a node
   */
  private generateHTML(node: BaseNode, className: string, childrenHTML: string): string {
    const hasContent = childrenHTML.length > 0;
    const textContent = node.type === 'TEXT' ? (node as TextNode).characters : '';

    switch (node.type) {
      case 'TEXT':
        return `<span class="${className}">${this.escapeHTML(textContent)}</span>`;
      
      case 'VECTOR':
        // For vectors, we'd typically need SVG or image fallback
        return `<div class="${className}"></div>`;
      
      case 'ELLIPSE':
        return `<div class="${className}"></div>`;
      
      case 'RECTANGLE':
        return `<div class="${className}"></div>`;
      
      case 'INSTANCE':
      case 'COMPONENT':
        return `<div class="${className}">\n${this.indent(childrenHTML, 2)}\n</div>`;
      
      case 'FRAME':
      case 'GROUP':
      default:
        if (hasContent) {
          return `<div class="${className}">\n${this.indent(childrenHTML, 2)}\n</div>`;
        }
        return `<div class="${className}"></div>`;
    }
  }

  /**
   * Generate unique class name
   */
  private generateClassName(baseName: string): string {
    // Sanitize base name
    const sanitized = baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return `figma-${sanitized}-${this.classCounter++}`;
  }

  /**
   * Generate all CSS rules
   */
  private generateAllCSS(): string {
    const lines: string[] = [];

    // Reset
    lines.push('* {');
    lines.push('  box-sizing: border-box;');
    lines.push('  margin: 0;');
    lines.push('  padding: 0;');
    lines.push('}\n');

    // Container base
    lines.push('#figma-render {');
    lines.push('  position: relative;');
    lines.push('  width: 100%;');
    lines.push('  min-height: 100vh;');
    lines.push('  font-family: system-ui, -apple-system, sans-serif;');
    lines.push('}\n');

    // All generated classes
    for (const cls of this.classes) {
      lines.push(`.${cls.selector.replace('figma-', '')} {`);
      for (const [name, value] of Object.entries(cls.properties)) {
        lines.push(`  ${name}: ${value};`);
      }
      lines.push('}\n');
    }

    return lines.join('');
  }

  /**
   * Generate container CSS
   */
  private generateContainerCSS(containerId: string): string {
    return `#${containerId} {
  position: relative;
  width: 100%;
  min-height: 100vh;
}`;
  }

  /**
   * Indent text
   */
  private indent(text: string, spaces: number): string {
    if (!text) return '';
    const indent = ' '.repeat(spaces);
    return text.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * Escape HTML entities
   */
  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// ============================================
// EXPORT FUNCTION
// ============================================

export function renderFigmaToCSS(node: BaseNode): { html: string; css: string } {
  const renderer = new FigmaRenderer();
  return renderer.render(node);
}

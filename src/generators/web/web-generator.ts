import Mustache from 'mustache';
import { BaseNode, FrameNode, TextNode, RectangleNode, Color } from '../types/figma-node';

// ============================================
// CSS PROPERTY MAPPINGS
// ============================================

export function colorToCSS(color: Color | undefined): string {
  if (!color) return 'transparent';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a < 1 ? ` / ${color.a}` : '';
  return `rgb(${r}${a}, ${g}, ${b})`;
}

export function spacingToCSS(px: number | undefined): string {
  return px !== undefined ? `${px}px` : '0';
}

export function fontSizeToCSS(px: number): string {
  return `${px}px`;
}

export function fontWeightToCSS(weight: number): string {
  if (weight >= 900) return '900';
  if (weight >= 700) return 'bold';
  if (weight >= 500) return '500';
  return 'normal';
}

export function layoutModeToCSS(mode: string | undefined): string {
  switch (mode) {
    case 'HORIZONTAL': return 'flex';
    case 'VERTICAL': return 'flex';
    case 'GRID': return 'grid';
    default: return 'relative';
  }
}

export function flexDirection(mode: string | undefined): string {
  switch (mode) {
    case 'HORIZONTAL': return 'row';
    case 'VERTICAL': return 'column';
    default: return 'row';
  }
}

export function flexWrap(wrap: string | undefined): string {
  return wrap === 'WRAP' ? 'wrap' : 'nowrap';
}

export function justifyContent(value: string | undefined): string {
  switch (value) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    default: return 'flex-start';
  }
}

export function alignItems(value: string | undefined): string {
  switch (value) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'BASELINE': return 'baseline';
    default: return 'flex-start';
  }
}

export function textAlign(value: string | undefined): string {
  switch (value) {
    case 'LEFT': return 'left';
    case 'CENTER': return 'center';
    case 'RIGHT': return 'right';
    case 'JUSTIFIED': return 'justify';
    default: return 'left';
  }
}

export function verticalAlign(value: string | undefined): string {
  switch (value) {
    case 'TOP': return 'flex-start';
    case 'CENTER': return 'center';
    case 'BOTTOM': return 'flex-end';
    default: return 'flex-start';
  }
}

export function borderRadiusToCSS(radius: number | undefined, cornerRadii: [number, number, number, number] | undefined): string {
  if (cornerRadii) {
    return cornerRadii.map(r => `${r}px`).join(' ');
  }
  return radius !== undefined ? `${radius}px` : '0';
}

export function boxShadowToCSS(effects: any[] | undefined): string {
  if (!effects || effects.length === 0) return 'none';
  
  const shadows: string[] = [];
  for (const effect of effects) {
    if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
      const color = colorToCSS(effect.color);
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const radius = effect.radius || 0;
      const spread = effect.spread || 0;
      shadows.push(`${x}px ${y}px ${radius}px ${spread}px ${color}`);
    }
  }
  return shadows.length > 0 ? shadows.join(', ') : 'none';
}

export function opacityToCSS(opacity: number | undefined): number {
  return opacity ?? 1;
}

// ============================================
// NODE TO CSS CLASS
// ============================================

export interface CSSClass {
  name: string;
  properties: Record<string, string>;
}

export class CSSGenerator {
  private classCounter: number = 0;
  private classes: Map<string, CSSClass> = new Map();
  private usedColors: Map<string, string> = new Map();

  generateCSS(node: BaseNode, prefix: string = 'node'): { css: string; html: string } {
    this.classes.clear();
    this.classCounter = 0;
    this.usedColors.clear();

    const html = this.nodeToHTML(node, prefix);
    const css = this.generateCSSRules(prefix);

    return { css, html };
  }

  private getClassName(): string {
    return `figma-${this.classCounter++}`;
  }

  private getColorVariable(color: Color): string {
    const key = `${color.r},${color.g},${color.b},${color.a}`;
    if (!this.usedColors.has(key)) {
      const varName = `color-${this.usedColors.size}`;
      this.usedColors.set(key, varName);
    }
    return this.usedColors.get(key)!;
  }

  private nodeToHTML(node: BaseNode, prefix: string): string {
    const className = this.getClassName();
    const properties = this.nodeToProperties(node, className);

    if (properties.length > 0) {
      this.classes.set(className, {
        name: className,
        properties: properties.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {}),
      });
    }

    let childrenHTML = '';
    if (node.children && node.children.length > 0) {
      childrenHTML = node.children
        .map((child, index) => this.nodeToHTML(child, `${prefix}-${index}`))
        .join('\n');
    }

    switch (node.type) {
      case 'TEXT':
        return this.wrapWithClass(
          className,
          (node as TextNode).characters,
          childrenHTML
        );
      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
        return this.wrapWithClass(
          className,
          childrenHTML,
          childrenHTML
        );
      default:
        return this.wrapWithClass(className, '', childrenHTML);
    }
  }

  private wrapWithClass(className: string, content: string, children: string): string {
    if (content) {
      return `<div class="${className}">${content}</div>`;
    } else if (children) {
      return `<div class="${className}">\n${this.indent(children, 2)}\n</div>`;
    }
    return `<div class="${className}"></div>`;
  }

  private indent(str: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return str.split('\n').map(line => indent + line).join('\n');
  }

  private nodeToProperties(node: BaseNode, className: string): Array<{ name: string; value: string }> {
    const props: Array<{ name: string; value: string }> = [];

    // Position and size
    if (node.absoluteBoundingBox) {
      props.push({ name: 'position', value: 'absolute' });
      props.push({ name: 'left', value: `${node.absoluteBoundingBox.x}px` });
      props.push({ name: 'top', value: `${node.absoluteBoundingBox.y}px` });
      props.push({ name: 'width', value: `${node.absoluteBoundingBox.width}px` });
      props.push({ name: 'height', value: `${node.absoluteBoundingBox.height}px` });
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      props.push({ name: 'opacity', value: node.opacity.toString() });
    }

    // Layout
    if (node.type === 'FRAME' || node.type === 'GROUP') {
      const frame = node as FrameNode;
      if (frame.layoutMode && frame.layoutMode !== 'NONE') {
        props.push({ name: 'display', value: layoutModeToCSS(frame.layoutMode) });
        props.push({ name: 'flex-direction', value: flexDirection(frame.layoutMode) });
        props.push({ name: 'flex-wrap', value: flexWrap(frame.layoutWrap) });
        props.push({ name: 'justify-content', value: justifyContent(frame.primaryAxisAlignItems) });
        props.push({ name: 'align-items', value: alignItems(frame.counterAxisAlignItems) });
      }

      if (frame.paddingTop) props.push({ name: 'padding-top', value: `${frame.paddingTop}px` });
      if (frame.paddingBottom) props.push({ name: 'padding-bottom', value: `${frame.paddingBottom}px` });
      if (frame.paddingLeft) props.push({ name: 'padding-left', value: `${frame.paddingLeft}px` });
      if (frame.paddingRight) props.push({ name: 'padding-right', value: `${frame.paddingRight}px` });
      if (frame.itemSpacing) props.push({ name: 'gap', value: `${frame.itemSpacing}px` });
    }

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        props.push({ name: 'background-color', value: colorToCSS(fill.color) });
      } else if (fill.type === 'IMAGE') {
        props.push({ name: 'background-image', value: `url(${fill.imageRef})` });
        props.push({ name: 'background-size', value: fill.scaleMode?.toLowerCase() || 'cover' });
      }
    }

    // Border
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      props.push({ name: 'border-style', value: 'solid' });
      props.push({ name: 'border-width', value: `${node.strokeWeight || 1}px` });
      if (stroke.color) {
        props.push({ name: 'border-color', value: colorToCSS(stroke.color) });
      }
    }

    // Corner radius
    if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
      const rect = node as RectangleNode;
      if (rect.cornerRadius !== undefined || rect.rectangleCornerRadii) {
        props.push({ name: 'border-radius', value: borderRadiusToCSS(rect.cornerRadius, rect.rectangleCornerRadii) });
      }
    }

    // Effects
    if (node.effects && node.effects.length > 0) {
      props.push({ name: 'box-shadow', value: boxShadowToCSS(node.effects) });
    }

    // Text properties
    if (node.type === 'TEXT') {
      const text = node as TextNode;
      if (text.style) {
        props.push({ name: 'font-family', value: text.style.fontFamily });
        props.push({ name: 'font-size', value: `${text.style.fontSize}px` });
        props.push({ name: 'font-weight', value: fontWeightToCSS(text.style.fontWeight) });
        props.push({ name: 'letter-spacing', value: `${text.style.letterSpacing || 0}px` });
        props.push({ name: 'line-height', value: text.style.lineHeightPx ? `${text.style.lineHeightPx}px` : 'normal' });
        props.push({ name: 'text-align', value: textAlign(text.style.textAlignHorizontal) });
      }
      if (text.fills && text.fills[0]?.color) {
        props.push({ name: 'color', value: colorToCSS(text.fills[0].color) });
      }
    }

    return props;
  }

  private generateCSSRules(prefix: string): string {
    const lines: string[] = [];

    // CSS variables for colors
    if (this.usedColors.size > 0) {
      lines.push(':root {');
      for (const [key, varName] of this.usedColors) {
        const [r, g, b, a] = key.split(',');
        lines.push(`  --${varName}: rgba(${r}, ${g}, ${b}, ${a});`);
      }
      lines.push('}\n');
    }

    // Base container
    lines.push(`.${prefix}-container {`);
    lines.push('  position: relative;');
    lines.push('  width: 100%;');
    lines.push('  min-height: 100vh;');
    lines.push('}\n');

    // Generated classes
    for (const [, cls] of this.classes) {
      lines.push(`.${cls.name} {`);
      for (const [name, value] of Object.entries(cls.properties)) {
        lines.push(`  ${name}: ${value};`);
      }
      lines.push('}\n');
    }

    return lines.join('\n');
  }
}

// ============================================
// HTML GENERATOR
// ============================================

export class WebGenerator {
  private cssGenerator: CSSGenerator;

  constructor() {
    this.cssGenerator = new CSSGenerator();
  }

  generate(node: BaseNode, options: { filename?: string } = {}): { html: string; css: string; filename: string } {
    const prefix = options.filename || 'figma-design';
    const { css, html } = this.cssGenerator.generateCSS(node, prefix);

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Design Export</title>
  <style>
${this.indent(css, 2)}
  </style>
</head>
<body>
  <div class="${prefix}-container">
${this.indent(html, 4)}
  </div>
</body>
</html>`;

    return {
      html: fullHTML,
      css: css,
      filename: `${prefix}.html`,
    };
  }

  private indent(str: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return str.split('\n').map(line => line.trim() ? indent + line : line).join('\n');
  }
}

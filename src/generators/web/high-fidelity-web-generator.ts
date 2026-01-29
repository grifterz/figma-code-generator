// ============================================
// HIGH-FIDELITY WEB GENERATOR
// Uses the new FigmaRenderer for pixel-perfect output
// ============================================

import { FigmaRenderer, renderFigmaToCSS } from '../renderer/figma-renderer';
import { BaseNode, FrameNode } from '../types/figma-node';

export interface WebGeneratorOptions {
  filename?: string;
  includeContainer?: boolean;
  containerId?: string;
}

export interface WebGeneratorResult {
  html: string;
  css: string;
  filename: string;
}

/**
 * High-fidelity web generator for pixel-perfect Figma rendering
 */
export class HighFidelityWebGenerator {
  private renderer: FigmaRenderer;

  constructor() {
    this.renderer = new FigmaRenderer();
  }

  /**
   * Generate HTML and CSS from a Figma node
   */
  generate(node: BaseNode, options: WebGeneratorOptions = {}): WebGeneratorResult {
    const filename = options.filename || 'figma-design';
    const containerId = options.containerId || filename;

    const { html, css } = this.renderer.render(node, {
      containerId,
      includeContainer: options.includeContainer !== false,
    });

    return {
      html: this.wrapHTML(html, css, filename),
      css,
      filename: `${filename}.html`,
    };
  }

  /**
   * Generate just the CSS
   */
  generateCSS(node: BaseNode): string {
    const { css } = this.renderer.render(node, { includeContainer: false });
    return css;
  }

  /**
   * Generate just the HTML (without wrapper)
   */
  generateHTML(node: BaseNode): string {
    const { html } = this.renderer.render(node, { includeContainer: false });
    return html;
  }

  /**
   * Wrap HTML with DOCTYPE, head, and body
   */
  private wrapHTML(html: string, css: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(title)}</title>
  <style>
${this.indent(css, 2)}
  </style>
</head>
<body>
${this.indent(html, 2)}
</body>
</html>`;
  }

  private indent(text: string, spaces: number): string {
    if (!text) return '';
    const indent = ' '.repeat(spaces);
    return text.split('\n').map(line => line.trim() ? indent + line : line).join('\n');
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Legacy web generator - kept for backward compatibility
 * Delegates to high-fidelity generator
 */
export class LegacyWebGenerator {
  private highFidelity: HighFidelityWebGenerator;

  constructor() {
    this.highFidelity = new HighFidelityWebGenerator();
  }

  generate(node: BaseNode, options: { filename?: string } = {}): { html: string; css: string; filename: string } {
    return this.highFidelity.generate(node, options);
  }
}

// ============================================
// EXPORT
// ============================================

export { HighFidelityWebGenerator as WebGenerator };
export { HighFidelityWebGenerator as default };

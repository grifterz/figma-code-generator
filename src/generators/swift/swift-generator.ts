import { BaseNode, FrameNode, TextNode, Color } from '../types/figma-node';

// ============================================
// SWIFTUI PROPERTY MAPPINGS
// ============================================

export function colorToSwift(color: Color | undefined): string {
  if (!color) return '.clear';
  const r = color.r.toFixed(3);
  const g = color.g.toFixed(3);
  const b = color.b.toFixed(3);
  const a = color.a < 1 ? `opacity: ${color.a.toFixed(3)}` : '';
  return `Color(red: ${r}, green: ${g}, blue: ${b})${a ? '.self' : ''}`;
}

export function spacingToSwift(px: number | undefined): string {
  return px !== undefined ? `.spacing(${px})` : '';
}

export function fontSizeToSwift(px: number): string {
  return `.system(size: ${px})`;
}

export function fontWeightToSwift(weight: number): string {
  if (weight >= 900) return '.black';
  if (weight >= 700) return '.bold';
  if (weight >= 500) return '.medium';
  if (weight >= 300) return '.light';
  return '.regular';
}

export function layoutModeToSwift(mode: string | undefined): string {
  return mode === 'HORIZONTAL' ? 'HStack' : mode === 'VERTICAL' ? 'VStack' : 'ZStack';
}

export function frameAlignment(mode: string | undefined): string {
  switch (mode) {
    case 'MIN': return '.leading';
    case 'CENTER': return '.center';
    case 'MAX': return '.trailing';
    default: return '.leading';
  }
}

export function textAlignment(value: string | undefined): string {
  switch (value) {
    case 'LEFT': return '.leading';
    case 'CENTER': return '.center';
    case 'RIGHT': return '.trailing';
    default: return '.leading';
  }
}

export function borderRadiusToSwift(radius: number | undefined): string {
  return radius !== undefined ? `.cornerRadius(${radius})` : '';
}

export function cornerRadiiToSwift(cornerRadii: [number, number, number, number] | undefined): string {
  if (!cornerRadii) return '';
  const [tl, tr, br, bl] = cornerRadii;
  // SwiftUI doesn't have individual corner radii in one modifier
  // We'd need to use a custom shape for this
  return `.cornerRadius(${Math.max(tl, tr, br, bl)}) /* Individual corners not fully supported */`;
}

export function boxShadowToSwift(effects: any[] | undefined): string {
  if (!effects || effects.length === 0) return '';
  
  const shadows: string[] = [];
  for (const effect of effects) {
    if (effect.type === 'DROP_SHADOW' && effect.visible !== false) {
      const color = colorToSwift(effect.color);
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const radius = effect.radius || 0;
      shadows.push(`.shadow(color: ${color}, x: ${x}, y: ${y}, blur: ${radius})`);
    }
  }
  return shadows.join('\n    ');
}

export function opacityToSwift(opacity: number | undefined): string {
  return opacity !== undefined && opacity < 1 ? `.opacity(${opacity.toFixed(2)})` : '';
}

// ============================================
// SWIFTUI GENERATOR
// ============================================

export class SwiftGenerator {
  private componentCounter: number = 0;

  generate(node: BaseNode, options: { viewName?: string } = {}): string {
    this.componentCounter = 0;
    const viewName = options.viewName || 'FigmaDesignView';
    const content = this.nodeToSwift(node, viewName, 0);
    
    return `import SwiftUI

${content}
`;
  }

  private nodeToSwift(node: BaseNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    
    switch (node.type) {
      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
        return this.frameToSwift(node as FrameNode, name, indent);
      case 'TEXT':
        return this.textToSwift(node as TextNode, name, indent);
      case 'RECTANGLE':
        return this.rectangleToSwift(node, name, indent);
      case 'ELLIPSE':
        return this.ellipseToSwift(node, name, indent);
      case 'VECTOR':
        return this.vectorToSwift(node, name, indent);
      default:
        return this.genericViewToSwift(node, name, indent);
    }
  }

  private frameToSwift(node: FrameNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    // Size modifiers
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
    }
    
    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        modifiers.push(`  .background(${colorToSwift(fill.color)})`);
      }
    }
    
    // Border
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        modifiers.push(`  .border(${colorToSwift(stroke.color)}, width: ${node.strokeWeight || 1})`);
      }
    }
    
    // Corner radius
    if (node.cornerRadius !== undefined) {
      modifiers.push(borderRadiusToSwift(node.cornerRadius));
    }
    
    // Effects
    if (node.effects && node.effects.length > 0) {
      const shadowMod = boxShadowToSwift(node.effects);
      if (shadowMod) {
        modifiers.push(shadowMod);
      }
    }
    
    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      modifiers.push(opacityToSwift(node.opacity));
    }

    // Layout modifiers
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      const stackType = node.layoutMode === 'HORIZONTAL' ? 'HStack' : 'VStack';
      
      if (node.itemSpacing) {
        modifiers.push(`  ${stackType}(spacing: ${node.itemSpacing})`);
      } else {
        modifiers.push(`  ${stackType} { }`);
      }
      
      if (node.primaryAxisAlignItems) {
        const alignment = frameAlignment(node.primaryAxisAlignItems);
        modifiers[modifiers.length - 1] = modifiers[modifiers.length - 1].replace('}', `alignment: ${alignment})`);
      }
    }

    // Children
    let childrenCode = '';
    if (node.children && node.children.length > 0) {
      const childViews = node.children.map((child, index) => {
        const childName = this.sanitizeName(child.name || `Child${index}`);
        return this.nodeToSwift(child, childName, indent + 1);
      });
      
      // If we have a stack, add children inside
      if (node.layoutMode && node.layoutMode !== 'NONE') {
        const stackIndex = modifiers.findIndex(m => m.includes('Stack('));
        if (stackIndex >= 0) {
          modifiers[stackIndex] = modifiers[stackIndex].replace('}', ' {');
          childrenCode = childViews.join('\n');
        }
      }
    }

    // Build the view
    let viewCode = '';
    if (node.layoutMode && node.layoutMode !== 'NONE' && childrenCode) {
      viewCode = `${indentation}${name} {\n${childrenCode}\n${indentation}}${modifiers.join('\n')}`;
    } else {
      viewCode = `${indentation}${name}${modifiers.join('')}`;
    }

    return viewCode;
  }

  private textToSwift(node: TextNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    // Font
    if (node.style) {
      const fontWeight = fontWeightToSwift(node.style.fontWeight);
      modifiers.push(`  .font(${fontSizeToSwift(node.style.fontSize)}${fontWeight})`);
    }
    
    // Text color
    if (node.fills && node.fills[0]?.color) {
      modifiers.push(`  .foregroundColor(${colorToSwift(node.fills[0].color)})`);
    }
    
    // Alignment
    if (node.style?.textAlignHorizontal) {
      modifiers.push(`  .multilineTextAlignment(${textAlignment(node.style.textAlignHorizontal)})`);
    }
    
    // Line height (approximate with fixed frame)
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height}, alignment: .${textAlignment(node.style?.textAlignHorizontal)})`);
    }
    
    return `${indentation}Text("${this.escapeString(node.characters)}")${modifiers.join('')}`;
  }

  private rectangleToSwift(node: BaseNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
    }
    
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        modifiers.push(`  .background(${colorToSwift(fill.color)})`);
      }
    }
    
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        modifiers.push(`  .border(${colorToSwift(stroke.color)}, width: ${node.strokeWeight || 1})`);
      }
    }
    
    if (node.cornerRadius !== undefined) {
      modifiers.push(borderRadiusToSwift(node.cornerRadius));
    }
    
    return `${indentation}RoundedRectangle()${modifiers.join('\n')}`;
  }

  private ellipseToSwift(node: BaseNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
    }
    
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        modifiers.push(`  .background(${colorToSwift(fill.color)})`);
      }
    }
    
    return `${indentation}Ellipse()${modifiers.join('\n')}`;
  }

  private vectorToSwift(node: BaseNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
    }
    
    // For complex vectors, we'd need SVG path conversion
    // This is a placeholder
    modifiers.push(`  /* Vector shape - requires path conversion */`);
    
    return `${indentation}// Vector: ${node.name}${modifiers.join('\n')}`;
  }

  private genericViewToSwift(node: BaseNode, name: string, indent: number): string {
    const indentation = '  '.repeat(indent);
    const modifiers: string[] = [];
    
    if (node.absoluteBoundingBox) {
      modifiers.push(`  .frame(width: ${node.absoluteBoundingBox.width}, height: ${node.absoluteBoundingBox.height})`);
    }
    
    return `${indentation}// ${node.type}: ${node.name}${modifiers.join('\n')}`;
  }

  private sanitizeName(name: string): string {
    // Convert to camelCase and remove invalid characters
    return name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map((word, index) => {
        if (index === 0) return word.charAt(0).toLowerCase() + word.slice(1);
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('')
      || `View${++this.componentCounter}`;
  }

  private escapeString(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

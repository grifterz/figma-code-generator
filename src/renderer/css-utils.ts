// ============================================
// HIGH-FIDELITY FIGMA TO CSS RENDERER
// Goal: Pixel-perfect replication of Figma designs
// ============================================

import { 
  BaseNode, 
  FrameNode, 
  TextNode, 
  Color,
  Paint,
  Effect,
  TypeStyle,
  LayoutMode,
  LayoutWrap,
} from '../types/figma-node';

// ============================================
// CSS UTILITIES
// ============================================

export function colorToRGBA(color: Color | undefined, defaultAlpha: number = 1): string {
  if (!color) return 'rgba(0, 0, 0, 0)';
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? defaultAlpha;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function colorToHex(color: Color | undefined): string {
  if (!color) return '#000000';
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function px(value: number | undefined, defaultValue: number = 0): string {
  return `${value ?? defaultValue}px`;
}

export function percent(value: number | undefined): string {
  return value !== undefined ? `${value}%` : 'auto';
}

export function fontWeight(weight: number): string {
  if (weight >= 900) return '900';
  if (weight >= 700) return 'bold';
  if (weight >= 600) return '600';
  if (weight >= 500) return '500';
  if (weight >= 400) return 'normal';
  if (weight >= 300) return '300';
  return 'normal';
}

export function flexDirection(mode: LayoutMode | undefined): string {
  switch (mode) {
    case 'HORIZONTAL': return 'row';
    case 'VERTICAL': return 'column';
    default: return 'row';
  }
}

export function flexWrap(wrap: LayoutWrap | undefined): string {
  return wrap === 'WRAP' ? 'wrap' : 'nowrap';
}

export function justifyContent(value: string | undefined): string {
  switch (value) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    case 'SPACE_AROUND': return 'space-around';
    case 'SPACE_EVENLY': return 'space-evenly';
    default: return 'flex-start';
  }
}

export function alignItems(value: string | undefined): string {
  switch (value) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'BASELINE': return 'baseline';
    case 'STRETCH': return 'stretch';
    default: return 'flex-start';
  }
}

export function alignContent(value: string | undefined): string {
  switch (value) {
    case 'MIN': return 'flex-start';
    case 'CENTER': return 'center';
    case 'MAX': return 'flex-end';
    case 'SPACE_BETWEEN': return 'space-between';
    case 'SPACE_AROUND': return 'space-around';
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

export function textAlignVertical(value: string | undefined): string {
  switch (value) {
    case 'TOP': return 'top';
    case 'CENTER': return 'middle';
    case 'BOTTOM': return 'bottom';
    default: return 'top';
  }
}

export function textDecoration(value: string | undefined): string {
  switch (value) {
    case 'UNDERLINE': return 'underline';
    case 'STRIKETHROUGH': return 'line-through';
    default: return 'none';
  }
}

export function textCase(value: string | undefined): string {
  switch (value) {
    case 'UPPER': return 'uppercase';
    case 'LOWER': return 'lowercase';
    case 'TITLE': return 'capitalize';
    default: return 'none';
  }
}

export function textOverflow(value: string | undefined): string {
  switch (value) {
    case 'TRUNCATE': return 'ellipsis';
    default: return 'clip';
  }
}

export function borderStyle(strokes: Paint[] | undefined): string {
  if (!strokes || strokes.length === 0) return 'none';
  return 'solid';
}

export function blendMode(value: string | undefined): string {
  switch (value) {
    case 'PASS_THROUGH': return 'normal';
    case 'NORMAL': return 'normal';
    case 'DARKEN': return 'darken';
    case 'MULTIPLY': return 'multiply';
    case 'LINEAR_BURN': return 'linear-burn';
    case 'COLOR_BURN': return 'color-burn';
    case 'LIGHTEN': return 'lighten';
    case 'SCREEN': return 'screen';
    case 'LINEAR_DODGE': return 'linear-dodge';
    case 'COLOR_DODGE': return 'color-dodge';
    case 'OVERLAY': return 'overlay';
    case 'SOFT_LIGHT': return 'soft-light';
    case 'HARD_LIGHT': return 'hard-light';
    case 'DIFFERENCE': return 'difference';
    case 'EXCLUSION': return 'exclusion';
    case 'HUE': return 'hue';
    case 'SATURATION': return 'saturation';
    case 'COLOR': return 'color';
    case 'LUMINOSITY': return 'luminosity';
    default: return 'normal';
  }
}

// ============================================
// GRADIENT SUPPORT
// ============================================

interface GradientStop {
  position: number;
  color: Color;
}

interface LinearGradient {
  type: 'GRADIENT_LINEAR';
  gradientStops: GradientStop[];
  gradientTransform?: number[][];
}

interface RadialGradient {
  type: 'GRADIENT_RADIAL';
  gradientStops: GradientStop[];
}

interface AngularGradient {
  type: 'GRADIENT_ANGULAR';
  gradientStops: GradientStop[];
}

interface DiamondGradient {
  type: 'GRADIENT_DIAMOND';
  gradientStops: GradientStop[];
}

type Gradient = LinearGradient | RadialGradient | AngularGradient | DiamondGradient;

export function paintToBackground(paint: Paint | undefined): string {
  if (!paint) return 'transparent';
  
  if (paint.type === 'SOLID' && paint.color) {
    return colorToRGBA(paint.color, paint.opacity);
  }
  
  if (paint.type?.startsWith('GRADIENT_')) {
    return gradientToCSS(paint as unknown as Gradient);
  }
  
  if (paint.type === 'IMAGE') {
    return `url(${paint.imageRef})`;
  }
  
  return 'transparent';
}

export function gradientToCSS(gradient: Gradient): string {
  const stops = gradient.gradientStops
    .sort((a, b) => a.position - b.position)
    .map(stop => `${colorToRGBA(stop.color)} ${stop.position * 100}%`)
    .join(', ');

  switch (gradient.type) {
    case 'GRADIENT_LINEAR':
      return `linear-gradient(${stops})`;
    case 'GRADIENT_RADIAL':
      return `radial-gradient(${stops})`;
    case 'GRADIENT_ANGULAR':
      return `conic-gradient(${stops})`;
    case 'GRADIENT_DIAMOND':
      return `linear-gradient(45deg, ${stops})`;
    default:
      return `linear-gradient(${stops})`;
  }
}

export function backgroundSize(scaleMode: string | undefined, imageWidth: number, imageHeight: number): string {
  switch (scaleMode) {
    case 'FILL': return 'cover';
    case 'FIT': return 'contain';
    case 'TILE': return 'repeat';
    case 'STRETCH': return '100% 100%';
    default: return 'cover';
  }
}

// ============================================
// EFFECTS (SHADOWS, BLURS)
// ============================================

export function effectsToCSS(effects: Effect[] | undefined): string {
  if (!effects || effects.length === 0) return 'none';
  
  const shadows: string[] = [];
  const backdropFilters: string[] = [];
  
  for (const effect of effects) {
    if (effect.visible === false) continue;
    
    const color = effect.color ? colorToRGBA(effect.color) : 'rgba(0, 0, 0, 0.25)';
    const x = effect.offset?.x ?? 0;
    const y = effect.offset?.y ?? 0;
    const radius = effect.radius ?? 0;
    const spread = effect.spread ?? 0;
    
    switch (effect.type) {
      case 'DROP_SHADOW':
        shadows.push(`${x}px ${y}px ${radius}px ${spread}px ${color}`);
        break;
      case 'INNER_SHADOW':
        shadows.push(`inset ${x}px ${y}px ${radius}px ${spread}px ${color}`);
        break;
      case 'LAYER_BLUR':
        // Note: Layer blur applies to the element itself, not children
        // This would require a wrapper element
        break;
      case 'BACKGROUND_BLUR':
        backdropFilters.push(`blur(${radius}px)`);
        break;
    }
  }
  
  const result: string[] = [];
  
  if (shadows.length > 0) {
    result.push(shadows.join(', '));
  }
  
  return result.length > 0 ? result.join(' ') : 'none';
}

export function backdropFilterToCSS(effects: Effect[] | undefined): string {
  if (!effects) return 'none';
  
  const blurEffects = effects
    .filter(e => e.visible !== false && e.type === 'BACKGROUND_BLUR' && e.radius);
  
  if (blurEffects.length === 0) return 'none';
  
  const blurValues = blurEffects.map(e => `blur(${e.radius}px)`);
  return blurValues.join(' ');
}

// ============================================
// CORNER RADIUS
// ============================================

export function cornerRadius(
  cornerRadius: number | undefined,
  rectangleCornerRadii: [number, number, number, number] | undefined
): string {
  if (rectangleCornerRadii) {
    return rectangleCornerRadii.map(r => `${r}px`).join(' ');
  }
  return cornerRadius !== undefined ? `${cornerRadius}px` : '0';
}

// ============================================
// STROKE PROPERTIES
// ============================================

export function strokeWidth(strokeWeight: number | undefined, strokeAlign: string | undefined): string {
  const width = strokeWeight ?? 0;
  const align = strokeAlign ?? 'CENTER';
  
  // For 'INSIDE' or 'OUTSIDE', we'd need box-sizing adjustments
  // For now, treat all as center and let CSS handle it
  return `${width}px`;
}

// ============================================
// LAYOUT HANDLING
// ============================================

export interface LayoutResult {
  display: string;
  position: string;
  top: string;
  left: string;
  width: string;
  height: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

export function calculateLayout(
  node: BaseNode,
  parentLayoutMode: LayoutMode | undefined,
  parentAbsoluteBoundingBox: { x: number; y: number; width: number; height: number } | undefined
): LayoutResult {
  const result: LayoutResult = {
    display: 'block',
    position: 'absolute',
    top: px(node.absoluteBoundingBox?.y),
    left: px(node.absoluteBoundingBox?.x),
    width: px(node.absoluteBoundingBox?.width),
    height: px(node.absoluteBoundingBox?.height),
  };

  const isFrame = node.type === 'FRAME';
  
  // Auto-layout frame
  if (isFrame && (node as FrameNode).layoutMode && (node as FrameNode).layoutMode !== 'NONE') {
    const frame = node as FrameNode;
    result.display = 'flex';
    result.position = 'relative';
    result.flexDirection = flexDirection(frame.layoutMode);
    result.flexWrap = flexWrap(frame.layoutWrap);
    result.justifyContent = justifyContent(frame.primaryAxisAlignItems);
    result.alignItems = alignItems(frame.counterAxisAlignItems);
    result.gap = px(frame.itemSpacing);
    
    // Reset absolute positioning for auto-layout children
    result.top = 'auto';
    result.left = 'auto';
    
    // Set explicit dimensions for auto-layout
    if (frame.layoutSizingHorizontal === 'FILL') {
      result.width = '100%';
    }
    if (frame.layoutSizingVertical === 'FILL') {
      result.height = 'auto';
      result.minHeight = '0';
    }
    
    // Padding
    if (frame.paddingTop) result.paddingTop = px(frame.paddingTop);
    if (frame.paddingRight) result.paddingRight = px(frame.paddingRight);
    if (frame.paddingBottom) result.paddingBottom = px(frame.paddingBottom);
    if (frame.paddingLeft) result.paddingLeft = px(frame.paddingLeft);
  }
  
  // Group or non-auto-layout node
  if (node.type === 'GROUP' || (isFrame && (!((node as FrameNode).layoutMode) || (node as FrameNode).layoutMode === 'NONE'))) {
    result.display = 'block';
    result.position = 'absolute';
  }
  
  // Text nodes - auto-size
  if (node.type === 'TEXT') {
    result.position = 'relative';
  }
  
  return result;
}

// ============================================
// TEXT STYLING
// ============================================

export function textStyleToCSS(style: TypeStyle | undefined): Record<string, string> {
  if (!style) return {};
  
  return {
    'font-family': style.fontFamily,
    'font-size': `${style.fontSize}px`,
    'font-weight': fontWeight(style.fontWeight),
    'font-style': style.fontStyle?.toLowerCase() || 'normal',
    'letter-spacing': `${style.letterSpacing ?? 0}px`,
    'line-height': style.lineHeightPx ? `${style.lineHeightPx}px` : 'normal',
    'text-align': textAlign(style.textAlignHorizontal),
    'text-decoration': textDecoration(style.textDecoration),
    'text-transform': textCase(style.textCase),
  };
}

// ============================================
// PARSING UTILITIES
// ============================================

export function getPrimaryFill(node: BaseNode): Paint | undefined {
  if (!node.fills || node.fills.length === 0) return undefined;
  
  // Return the first visible fill
  const visible = node.fills.find(f => f.visible !== false);
  return visible ?? node.fills[0];
}

export function getPrimaryStroke(node: BaseNode): Paint | undefined {
  if (!node.strokes || node.strokes.length === 0) return undefined;
  
  const visible = node.strokes.find(s => s.visible !== false);
  return visible ?? node.strokes[0];
}

export function isVisible(node: BaseNode): boolean {
  return node.visible !== false;
}

export function hasAutoLayout(node: BaseNode): boolean {
  return node.type === 'FRAME' && 
    (node as FrameNode).layoutMode !== undefined && 
    (node as FrameNode).layoutMode !== 'NONE';
}

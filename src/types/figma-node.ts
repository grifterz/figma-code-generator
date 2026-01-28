// ============================================
// FIGMA NODE TYPES (Internal AST)
// ============================================

export type NodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'TEXT'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'REGULAR_POLYGON'
  | 'SLICE';

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
export type LayoutWrap = 'NO_WRAP' | 'WRAP';
export type TextAlignHorizontal = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
export type TextAlignVertical = 'TOP' | 'CENTER' | 'BOTTOM';
export type StrokeAlign = 'INSIDE' | 'OUTSIDE' | 'CENTER';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Size {}

// Color in Figma is 0-1 range
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: Color; // For SOLID
  gradientStops?: ColorStop[]; // For gradients
  imageRef?: string; // For IMAGE
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
}

export interface ColorStop {
  position: number; // 0-1
  color: Color;
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  radius?: number;
  color?: Color;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontStyle?: string; // e.g., "Bold", "Italic"
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal?: TextAlignHorizontal;
  textAlignVertical?: TextAlignVertical;
  letterSpacing?: number;
  lineHeightPx?: number;
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
}

export interface LayoutConstraints {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

// Base interface for all nodes
export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  visible?: boolean;
  opacity?: number;
  absolutePosition?: Position;
  absoluteBoundingBox?: Rectangle;
  layoutMode?: LayoutMode;
  layoutWrap?: LayoutWrap;
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: Effect[];
  stylesMap?: Record<string, string>; // styleType -> styleId
  children?: Node[];
}

// Frame-specific
export interface FrameNode extends BaseNode {
  type: 'FRAME';
  clipsContent?: boolean;
  layoutAlign?: 'INHERIT' | 'STRETCH';
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
}

// Text-specific
export interface TextNode extends BaseNode {
  type: 'TEXT';
  characters: string;
  style: TypeStyle;
  textAutoResize?: 'NONE' | 'HEIGHT' | 'WIDTH_AND_HEIGHT';
}

// Rectangle-specific (also used for RECTANGLE shape)
export interface RectangleNode extends BaseNode {
  type: 'RECTANGLE';
  cornerSmoothing?: number;
}

// Vector-specific
export interface VectorNode extends BaseNode {
  type: 'VECTOR';
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE';
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
}

// Ellipse-specific
export interface EllipseNode extends BaseNode {
  type: 'ELLIPSE';
  arcData?: {
    startingAngle: number;
    endingAngle: number;
    innerRadius: number;
  };
}

// Component
export interface ComponentNode extends BaseNode {
  type: 'COMPONENT';
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
}

// Instance
export interface InstanceNode extends BaseNode {
  type: 'INSTANCE';
  componentId: string;
  componentProperties?: Record<string, ComponentProperty>;
}

// Component property definitions
export interface ComponentPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue?: boolean | string;
  variantOptions?: string[];
}

// Union type for all nodes
export type Node = 
  | FrameNode
  | TextNode
  | RectangleNode
  | VectorNode
  | EllipseNode
  | ComponentNode
  | InstanceNode
  | BaseNode;

// Design tokens extracted from Figma
export interface DesignTokens {
  colors: Record<string, Color>;
  textStyles: Record<string, TypeStyle>;
  effects: Record<string, Effect>;
}

// Parsed document structure
export interface ParsedDocument {
  name: string;
  lastModified: string;
  version: string;
  components: Record<string, ComponentNode>;
  styles: Record<string, DesignStyle>;
  pages: ParsedPage[];
}

export interface ParsedPage {
  id: string;
  name: string;
  frames: FrameNode[];
}

export interface DesignStyle {
  key: string;
  name: string;
  type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

// Generator output options
export interface GeneratorOptions {
  output: 'web' | 'swift';
  format?: 'html' | 'css' | 'swift';
  componentPrefix?: string;
}

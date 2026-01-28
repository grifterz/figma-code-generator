// ============================================
// FIGMA API RESPONSE TYPES
// Based on https://www.figma.com/developers/api
// ============================================

// Base response wrapper
export interface FigmaResponse<T> {
  err?: string;
  status?: number;
}

// GET /v1/files/:key
export interface GetFileResponse extends FigmaResponse<never> {
  name: string;
  role: string;
  lastModified: string;
  editorType: string;
  thumbnailUrl: string;
  version: string;
  document: DocumentNode;
  components: Record<string, Component>;
  componentSets: Record<string, ComponentSet>;
  schemaVersion: number;
  styles: Record<string, Style>;
  mainFileKey?: string;
  branches?: Array<{
    key: string;
    name: string;
    thumbnailUrl: string;
    lastModified: string;
    linkAccess: string;
  }>;
}

// GET /v1/files/:key/nodes
export interface GetFileNodesResponse extends FigmaResponse<never> {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  nodes: Record<string, {
    document: Node;
    components: Record<string, Component>;
    componentSets: Record<string, ComponentSet>;
    styles: Record<string, Style>;
  }>;
}

// GET /v1/images/:key
export interface GetImagesResponse extends FigmaResponse<never> {
  images: Record<string, string | null>;
  status: number;
}

// ============================================
// NODE TYPES (from Figma API)
// ============================================

export type FigmaNodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'TEXT'
  | 'STAR'
  | 'LINE'
  | 'REGULAR_POLYGON'
  | 'TABLE'
  | 'TABLE_CELL'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'WASHI_TAPE'
  | 'BOOLEAN_OPERATION'
  | 'SLICE';

// Base node properties
export interface BaseNodeProps {
  id: string;
  name: string;
  type: FigmaNodeType;
  visible?: boolean;
  opacity?: number;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteRenderBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  relativeTransform?: [
    [number, number, number],
    [number, number, number]
  ];
  constrained?: boolean;
  blendMode?: BlendMode;
  isMask?: boolean;
}

// DOCUMENT node
export interface DocumentNode extends BaseNodeProps {
  type: 'DOCUMENT';
  children: CanvasNode[];
}

// CANVAS node (page)
export interface CanvasNode extends BaseNodeProps {
  type: 'CANVAS';
  backgroundColor?: Color;
  children: Node[];
  flowStartingPoints?: Array<{
    nodeId: string;
    name: string;
  }>;
  prototypeDevice?: PrototypeDevice;
  exportSettings?: ExportSetting[];
}

// FRAME node
export interface FrameNode extends BaseNodeProps {
  type: 'FRAME';
  children: Node[];
  locked?: boolean;
  background?: Paint[]; // deprecated
  backgroundColor?: Color; // deprecated
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  strokeCap?: string;
  strokeJoin?: string;
  strokeDashes?: number[];
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  cornerSmoothing?: number;
  exportSettings?: ExportSetting[];
  clipsContent?: boolean;
  layoutMode?: LayoutMode;
  layoutWrap?: LayoutWrap;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  counterAxisAlignContent?: string;
  layoutAlign?: string;
  layoutSizingHorizontal?: string;
  layoutSizingVertical?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  layoutPositioning?: string;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// GROUP node (same props as FRAME)
export interface GroupNode extends BaseNodeProps {
  type: 'GROUP';
  children: Node[];
  locked?: boolean;
  exportSettings?: ExportSetting[];
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// VECTOR node
export interface VectorNode extends BaseNodeProps {
  type: 'VECTOR';
  locked?: boolean;
  exportSettings?: ExportSetting[];
  fills?: Paint[];
  fillGeometry?: Path[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  strokeCap?: string;
  strokeJoin?: string;
  strokeDashes?: number[];
  strokeMiterAngle?: number;
  individualStrokeWeights?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// RECTANGLE node
export interface RectangleNode extends BaseNodeProps {
  type: 'RECTANGLE';
  locked?: boolean;
  exportSettings?: ExportSetting[];
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  cornerSmoothing?: number;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// ELLIPSE node
export interface EllipseNode extends BaseNodeProps {
  type: 'ELLIPSE';
  locked?: boolean;
  exportSettings?: ExportSetting[];
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  arcData?: {
    startingAngle: number;
    endingAngle: number;
    innerRadius: number;
  };
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// TEXT node
export interface TextNode extends BaseNodeProps {
  type: 'TEXT';
  characters: string;
  style: TypeStyle;
  textStyleId?: string;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<number, TypeStyle>;
  lineTypes?: string[];
  lineIndentations?: number[];
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// COMPONENT node
export interface ComponentNode extends BaseNodeProps {
  type: 'COMPONENT';
  children: Node[];
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
  exportSettings?: ExportSetting[];
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// COMPONENT_SET node
export interface ComponentSetNode extends BaseNodeProps {
  type: 'COMPONENT_SET';
  children: Node[];
  componentPropertyDefinitions?: Record<string, ComponentPropertyDefinition>;
  exportSettings?: ExportSetting[];
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// INSTANCE node
export interface InstanceNode extends BaseNodeProps {
  type: 'INSTANCE';
  children: Node[];
  componentId: string;
  isExposedInstance?: boolean;
  exposedInstances?: string[];
  componentProperties?: Record<string, ComponentProperty>;
  overrides?: Array<{
    id: string;
    overriddenFields: string[];
  }>;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: StrokeAlign;
  effects?: Effect[];
  stylesMap?: Record<string, string>;
}

// Union type for all nodes
export type Node = 
  | DocumentNode
  | CanvasNode
  | FrameNode
  | GroupNode
  | VectorNode
  | RectangleNode
  | EllipseNode
  | TextNode
  | ComponentNode
  | ComponentSetNode
  | InstanceNode
  | BaseNodeProps;

// ============================================
// PROPERTY TYPES
// ============================================

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Paint {
  type: PaintType;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  color?: Color;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  gradientStops?: Array<{
    position: number;
    color: Color;
  }>;
  imageRef?: string;
  scaleMode?: string;
  imageTransform?: [[number, number, number], [number, number, number]];
  scalingFactor?: number;
  rotation?: number;
  filters?: ImageFilters;
  gifRef?: string;
}

export type PaintType = 
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'GRADIENT_ANGULAR'
  | 'GRADIENT_DIAMOND'
  | 'IMAGE'
  | 'EMOJI'
  | 'VIDEO'
  | 'PATTERN';

export interface ImageFilters {
  exposure?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
}

export interface Effect {
  type: EffectType;
  visible?: boolean;
  radius?: number;
  color?: Color;
  blendMode?: BlendMode;
  offset?: { x: number; y: number };
  spread?: number;
  showShadowBehindNode?: boolean;
  blurType?: string;
}

export type EffectType = 
  | 'DROP_SHADOW'
  | 'INNER_SHADOW'
  | 'LAYER_BLUR'
  | 'BACKGROUND_BLUR'
  | 'TEXTURE'
  | 'NOISE';

export type BlendMode = 
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export type StrokeAlign = 'INSIDE' | 'OUTSIDE' | 'CENTER';

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';

export type LayoutWrap = 'NO_WRAP' | 'WRAP';

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontStyle?: string;
  fontSize: number;
  fontWeight: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  italic?: boolean;
  textCase?: string;
  textDecoration?: string;
  textAutoResize?: string;
  textTruncation?: string;
  maxLines?: number;
  fills?: Paint[];
  hyperlink?: {
    type: 'URL' | 'NODE';
    url?: string;
    nodeId?: string;
  };
  openTypeFlags?: Record<string, number>;
  isOverrideOverTextStyle?: boolean;
  semanticWeight?: string;
  semanticItalic?: string;
  boundVariables?: Record<string, { type: string; id: string }>;
}

export interface ExportSetting {
  suffix: string;
  format: 'JPG' | 'PNG' | 'SVG';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

export interface Path {
  path: string;
  windingRule: string;
  overrideId?: number;
}

export interface PrototypeDevice {
  type: string;
  size: { width: number; height: number };
  presetIdentifier?: string;
  rotation?: string;
}

export interface ComponentPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue?: boolean | string;
  variantOptions?: string[];
  preferredValues?: Array<{
    type: 'COMPONENT' | 'COMPONENT_SET';
    key: string;
  }>;
}

export interface ComponentProperty {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  value: boolean | string;
  preferredValues?: Array<{
    type: 'COMPONENT' | 'COMPONENT_SET';
    key: string;
  }>;
  boundVariables?: Record<string, { type: string; id: string }>;
}

// ============================================
// COMPONENT & STYLE METADATA
// ============================================

export interface Component {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks?: Array<{ uri: string }>;
  remote: boolean;
}

export interface ComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks?: Array<{ uri: string }>;
  remote: boolean;
}

export interface Style {
  key: string;
  name: string;
  description: string;
  remote: boolean;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

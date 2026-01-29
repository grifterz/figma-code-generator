import { 
  Node as FigmaNode,
  DocumentNode,
  CanvasNode,
  FrameNode as FigmaFrameNode,
  GroupNode as FigmaGroupNode,
  VectorNode as FigmaVectorNode,
  RectangleNode as FigmaRectangleNode,
  EllipseNode as FigmaEllipseNode,
  TextNode as FigmaTextNode,
  ComponentNode as FigmaComponentNode,
  ComponentSetNode as FigmaComponentSetNode,
  InstanceNode as FigmaInstanceNode,
  BaseNodeProps,
} from '../api/figma-api-types';
import {
  BaseNode,
  FrameNode,
  TextNode,
  RectangleNode,
  VectorNode,
  EllipseNode,
  ComponentNode,
  InstanceNode,
  NodeType,
  Color,
} from '../types/figma-node';

export class NodeTransformer {
  /**
   * Transform a Figma API node to our internal AST format
   */
  transform(node: FigmaNode): BaseNode {
    // Type guard functions
    const isDocument = (n: FigmaNode): n is DocumentNode => n.type === 'DOCUMENT';
    const isCanvas = (n: FigmaNode): n is CanvasNode => n.type === 'CANVAS';
    const isFrame = (n: FigmaNode): n is FigmaFrameNode => n.type === 'FRAME';
    const isGroup = (n: FigmaNode): n is FigmaGroupNode => n.type === 'GROUP';
    const isText = (n: FigmaNode): n is FigmaTextNode => n.type === 'TEXT';
    const isRectangle = (n: FigmaNode): n is FigmaRectangleNode => n.type === 'RECTANGLE';
    const isVector = (n: FigmaNode): n is FigmaVectorNode => n.type === 'VECTOR';
    const isEllipse = (n: FigmaNode): n is FigmaEllipseNode => n.type === 'ELLIPSE';
    const isComponent = (n: FigmaNode): n is FigmaComponentNode => n.type === 'COMPONENT';
    const isComponentSet = (n: FigmaNode): n is FigmaComponentSetNode => n.type === 'COMPONENT_SET';
    const isInstance = (n: FigmaNode): n is FigmaInstanceNode => n.type === 'INSTANCE';

    if (isDocument(node)) return this.transformDocument(node);
    if (isCanvas(node)) return this.transformCanvas(node);
    if (isFrame(node)) return this.transformFrame(node);
    if (isGroup(node)) return this.transformGroup(node);
    if (isText(node)) return this.transformText(node);
    if (isRectangle(node)) return this.transformRectangle(node);
    if (isVector(node)) return this.transformVector(node);
    if (isEllipse(node)) return this.transformEllipse(node);
    if (isComponent(node)) return this.transformComponent(node);
    if (isComponentSet(node)) return this.transformComponent(node);
    if (isInstance(node)) return this.transformInstance(node);
    return this.transformBaseNode(node);
  }

  private transformDocument(node: DocumentNode): BaseNode {
    return {
      id: node.id,
      name: node.name,
      type: 'DOCUMENT',
      children: node.children?.map(child => this.transform(child)),
    } as BaseNode;
  }

  private transformCanvas(node: CanvasNode): BaseNode {
    return {
      id: node.id,
      name: node.name,
      type: 'CANVAS',
      children: node.children?.map(child => this.transform(child)),
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
    } as BaseNode;
  }

  private transformFrame(node: FigmaFrameNode): FrameNode {
    return {
      id: node.id,
      name: node.name,
      type: 'FRAME',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      layoutMode: node.layoutMode as FrameNode['layoutMode'],
      layoutWrap: node.layoutWrap as FrameNode['layoutWrap'],
      primaryAxisAlignItems: node.primaryAxisAlignItems as FrameNode['primaryAxisAlignItems'],
      counterAxisAlignItems: node.counterAxisAlignItems as FrameNode['counterAxisAlignItems'],
      paddingLeft: node.paddingLeft,
      paddingRight: node.paddingRight,
      paddingTop: node.paddingTop,
      paddingBottom: node.paddingBottom,
      itemSpacing: node.itemSpacing,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      cornerRadius: node.cornerRadius,
      rectangleCornerRadii: node.rectangleCornerRadii,
      effects: this.transformEffects(node.effects),
      stylesMap: node.stylesMap,
      clipsContent: node.clipsContent,
      children: node.children?.map(child => this.transform(child)),
    };
  }

  private transformGroup(node: FigmaGroupNode): BaseNode {
    // Cast to any because Figma API GroupNode doesn't have fills/strokes but internal type does
    const nodeAny = node as any;
    return {
      id: node.id,
      name: node.name,
      type: 'GROUP',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      fills: nodeAny.fills ? this.transformFills(nodeAny.fills) : undefined,
      strokes: nodeAny.strokes ? this.transformStrokes(nodeAny.strokes) : undefined,
      effects: nodeAny.effects ? this.transformEffects(nodeAny.effects) : undefined,
      children: node.children?.map(child => this.transform(child)),
    };
  }

  private transformText(node: FigmaTextNode): TextNode {
    return {
      id: node.id,
      name: node.name,
      type: 'TEXT',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      characters: node.characters,
      style: {
        fontFamily: node.style?.fontFamily || 'Arial',
        fontPostScriptName: node.style?.fontPostScriptName,
        fontStyle: node.style?.fontStyle,
        fontSize: node.style?.fontSize || 14,
        fontWeight: node.style?.fontWeight || 400,
        textAlignHorizontal: node.style?.textAlignHorizontal as any,
        textAlignVertical: node.style?.textAlignVertical as any,
        letterSpacing: node.style?.letterSpacing,
        lineHeightPx: node.style?.lineHeightPx,
        textDecoration: node.style?.textDecoration as any,
        textCase: node.style?.textCase as any,
      },
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      effects: this.transformEffects(node.effects),
    };
  }

  private transformRectangle(node: FigmaRectangleNode): RectangleNode {
    return {
      id: node.id,
      name: node.name,
      type: 'RECTANGLE',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      cornerRadius: node.cornerRadius,
      rectangleCornerRadii: node.rectangleCornerRadii,
      cornerSmoothing: node.cornerSmoothing,
      effects: this.transformEffects(node.effects),
    };
  }

  private transformVector(node: FigmaVectorNode): VectorNode {
    return {
      id: node.id,
      name: node.name,
      type: 'VECTOR',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      strokeCap: node.strokeCap as VectorNode['strokeCap'],
      strokeJoin: node.strokeJoin as VectorNode['strokeJoin'],
      effects: this.transformEffects(node.effects),
    };
  }

  private transformEllipse(node: FigmaEllipseNode): EllipseNode {
    return {
      id: node.id,
      name: node.name,
      type: 'ELLIPSE',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      arcData: node.arcData,
      effects: this.transformEffects(node.effects),
    };
  }

  private transformComponent(node: FigmaComponentNode | FigmaComponentSetNode): ComponentNode {
    return {
      id: node.id,
      name: node.name,
      type: 'COMPONENT',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      effects: this.transformEffects(node.effects),
      children: node.children?.map(child => this.transform(child)),
    };
  }

  private transformInstance(node: FigmaInstanceNode): InstanceNode {
    return {
      id: node.id,
      name: node.name,
      type: 'INSTANCE',
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
      componentId: node.componentId,
      componentProperties: node.componentProperties as any,
      fills: this.transformFills(node.fills),
      strokes: this.transformStrokes(node.strokes),
      strokeWeight: node.strokeWeight,
      strokeAlign: node.strokeAlign,
      effects: this.transformEffects(node.effects),
      children: node.children?.map(child => this.transform(child)),
    };
  }

  private transformBaseNode(node: BaseNodeProps): BaseNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type as NodeType,
      visible: node.visible,
      opacity: node.opacity,
      absolutePosition: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
      } : undefined,
      absoluteBoundingBox: node.absoluteBoundingBox ? {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      } : undefined,
    };
  }

  private transformFills(fills: any[] | undefined): any[] | undefined {
    if (!fills) return undefined;
    return fills.map(fill => ({
      type: fill.type,
      visible: fill.visible,
      opacity: fill.opacity,
      color: fill.color,
    }));
  }

  private transformStrokes(strokes: any[] | undefined): any[] | undefined {
    if (!strokes) return undefined;
    return strokes.map(stroke => ({
      type: stroke.type,
      visible: stroke.visible,
      opacity: stroke.opacity,
      color: stroke.color,
    }));
  }

  private transformEffects(effects: any[] | undefined): any[] | undefined {
    if (!effects) return undefined;
    return effects.map(effect => ({
      type: effect.type,
      visible: effect.visible,
      radius: effect.radius,
      color: effect.color,
      offset: effect.offset,
      spread: effect.spread,
    }));
  }
}

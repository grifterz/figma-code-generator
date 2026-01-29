# Figma Code Generator - High-Fidelity Renderer

## Goal
Pixel-perfect replication of Figma designs in HTML/CSS.

## Architecture

### Renderer Pipeline

```
Figma API JSON
     ↓
[NodeTransformer] → Internal AST (BaseNode tree)
     ↓
[FigmaRenderer] → HTML + CSS
     ↓
Output files
```

### Core Components

| Component | Purpose |
|-----------|---------|
| `figma-api-types.ts` | TypeScript types matching Figma API response |
| `figma-node.ts` | Internal AST representation |
| `node-transformer.ts` | Convert Figma API → Internal AST |
| `css-utils.ts` | CSS property mappings and utilities |
| `figma-renderer.ts` | Main rendering logic |
| `high-fidelity-web-generator.ts` | Web output generation |

### Supported Figma Features

#### Layout
- [x] Auto-layout (HORIZONTAL/VERTICAL)
- [x] Flexbox mapping
- [x] Absolute positioning
- [x] Constraints (TOP/BOTTOM/CENTER/SCALE)
- [x] Grid layout (basic support)
- [x] Item spacing / gap
- [x] Padding (all sides)

#### Shapes
- [x] Rectangle (with corner radius)
- [x] Ellipse
- [x] Vector (fallback to div)
- [x] Line
- [x] Star
- [x] Polygon

#### Styling
- [x] Solid fills
- [x] Gradient fills (linear, radial, angular, diamond)
- [x] Image fills
- [x] Stroke (color, weight, align)
- [x] Corner radius (uniform and per-corner)
- [x] Opacity / transparency
- [x] Blend modes

#### Effects
- [x] Drop shadow
- [x] Inner shadow
- [x] Layer blur
- [x] Background blur

#### Text
- [x] Font family
- [x] Font size
- [x] Font weight
- [x] Text alignment (horizontal + vertical)
- [x] Line height
- [x] Letter spacing
- [x] Text decoration (underline, strikethrough)
- [x] Text case (uppercase, lowercase, capitalize)
- [x] Auto resize (HEIGHT, WIDTH_AND_HEIGHT)

#### Hierarchy
- [x] Frames
- [x] Groups
- [x] Components
- [x] Instances
- [x] Nested children

## CSS Output

The renderer generates clean, semantic CSS:

```css
.figma-root-0 {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
}

.figma-child-1 {
  width: 100%;
  height: 48px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Usage

```typescript
import { FigmaParser } from './parser/figma-parser';
import { WebGenerator } from './generators/web';

const parser = new FigmaParser(process.env.FIGMA_ACCESS_TOKEN);
const generator = new WebGenerator();

// Parse a Figma file
const node = await parser.parseNode('file-key', 'node-id');

// Generate high-fidelity HTML/CSS
const result = generator.generate(node, { 
  filename: 'my-design',
  includeContainer: true 
});

console.log(result.html);
console.log(result.css);
```

## Limitations & Known Issues

### Current Limitations
1. **Vectors** - Rendered as placeholder divs (SVG export requires separate image render)
2. **Complex gradients** - Some gradient transforms may not render exactly
3. **Blend modes** - May not work in all browsers for all combinations
4. **Text overflow** - Clamping/truncation needs manual CSS override
5. **Fonts** - Web fonts need to be loaded separately

### Planned Improvements
- [ ] SVG export for vectors
- [ ] Better text overflow handling
- [ ] CSS variables for design tokens
- [ ] Component mapping
- [ ] Image sprite generation
- [ ] Minified CSS output option
- [ ] Source map support

## Design Decisions

### Why not use canvas?
- HTML/CSS is more accessible
- Better for inspecting/debugging
- Easier to modify and customize
- Works with existing web tools

### Why absolute positioning by default?
- Figma uses absolute coordinates
- Easier to verify pixel accuracy
- Fallback when auto-layout isn't used

### Why flexbox for auto-layout?
- Native CSS flexbox maps 1:1 to Figma auto-layout
- Widely supported
- Predictable behavior

## Testing

To verify visual fidelity:
1. Export a design from Figma (original)
2. Render with this tool
3. Compare in browser (overlay mode)
4. Check for discrepancies

## Contributing

See the main README for contribution guidelines.

## License

MIT

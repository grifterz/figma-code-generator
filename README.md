# Figma to Web Generator

**High-fidelity pixel-perfect rendering of Figma designs to HTML/CSS.**

## 🎯 Goal

Replicate Figma designs exactly - extracting all data and piecing it together correctly in HTML/CSS.

## Architecture

```
Figma Design
     ↓
Figma API (REST)
     ↓
NodeTransformer → Internal AST
     ↓
HighFidelityRenderer → HTML + CSS
     ↓
Pixel-Perfect Output
```

## Features

### Layout
- ✅ Auto-layout (flexbox)
- ✅ Absolute positioning
- ✅ Constraints
- ✅ Grid support

### Shapes
- ✅ Rectangle (with corner radius)
- ✅ Ellipse
- ✅ Vector (fallback)
- ✅ Line, Star, Polygon

### Styling
- ✅ Solid & gradient fills
- ✅ Image backgrounds
- ✅ Stroke/border
- ✅ Corner radius
- ✅ Opacity & blend modes

### Effects
- ✅ Drop shadow
- ✅ Inner shadow
- ✅ Layer blur
- ✅ Background blur

### Text
- ✅ Font family, size, weight
- ✅ Text alignment
- ✅ Line height & letter spacing
- ✅ Decoration (underline, strikethrough)
- ✅ Auto-resize

### Hierarchy
- ✅ Frames, Groups
- ✅ Components & Instances
- ✅ Nested children

## Quick Start

### 1. Get Figma Access Token
```
Figma → Settings → Account → Personal access tokens → Create new
```

### 2. Set Environment Variable
```bash
# Create .env file
FIGMA_ACCESS_TOKEN=your_token_here
```

### 3. Run the Generator

**Command Line:**
```bash
npx figma-code-generator --url "https://www.figma.com/file/ABC123...?node-id=123:456"
```

**Programmatic:**
```typescript
import { FigmaParser, WebGenerator } from 'figma-code-generator';

const parser = new FigmaParser(process.env.FIGMA_ACCESS_TOKEN);
const generator = new WebGenerator();

// Parse and generate
const node = await parser.parseNode('file-key', 'node-id');
const result = generator.generate(node, { filename: 'my-design' });

console.log(result.html);
console.log(result.css);
```

### 4. Web Interface
```bash
cd web
npm run dev
# Open http://localhost:3000
```

## Output Example

**Input:** Figma frame with text, images, and auto-layout

**Output:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Design</title>
  <style>
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
  </style>
</head>
<body>
  <div class="figma-root-0">
    <div class="figma-child-1">...</div>
  </div>
</body>
</html>
```

## Rate Limiting

Figma API rate limits (per seat type):

| Tier | Starter | Professional | Enterprise |
|------|---------|--------------|------------|
| Tier 1 | 6/month | 15/min | 20/min |
| Tier 2 | 5/min | 50/min | 100/min |
| Tier 3 | 10/min | 100/min | 150/min |

**Best Practices:**
1. Batch requests when possible
2. Cache responses locally
3. Implement retry with backoff
4. Upgrade to Full/Dev seat for higher limits

## Project Structure

```
figma-code-generator/
├── src/
│   ├── api/              # Figma API client
│   ├── parser/           # Parse Figma API → AST
│   ├── renderer/         # High-fidelity CSS rendering
│   ├── generators/       # Output generators
│   │   ├── web/          # HTML/CSS output
│   │   └── swift/        # SwiftUI output
│   ├── transformers/     # Node transformation
│   └── types/            # TypeScript types
├── web/                  # Web interface
└── templates/            # Output templates
```

## Roadmap

- [ ] SVG export for vectors
- [ ] Design token extraction (colors, typography)
- [ ] Component mapping
- [ ] Image sprite generation
- [ ] React component output
- [ ] Tailwind CSS output
- [ ] Design system support

## Based On

Working implementation patterns from:
- `fisma-render-app` (original)
- Builder.io Mitosis
- FigmaToCode (open source)

## License

MIT

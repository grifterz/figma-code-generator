# Figma Code Generator

Convert Figma designs to production-ready web (HTML/CSS) and iOS (SwiftUI) code.

## Two Ways to Use

### 1. Web UI (Recommended for quick use)
A Next.js web app where you paste your Figma URL and see the generated code instantly.

### 2. CLI (For automation & integration)
A Node.js CLI for generating code from the command line or scripts.

## Features

- **Figma API Integration** - Fetch designs directly from Figma
- **Node Parsing** - Parse frames, text, shapes, components, and instances
- **Layout Support** - Auto-layout (horizontal, vertical, grid) to CSS Flexbox/Grid and SwiftUI HStack/VStack
- **Style Mapping** - Colors, typography, borders, shadows, and effects
- **Dual Output** - Generate both web and iOS code from the same source
- **TypeScript** - Full type safety throughout

## Quick Start

### 1. Install

```bash
cd figma-code-generator
npm install
```

### 2. Configure Figma Token

Create a `.env` file:

```bash
FIGMA_ACCESS_TOKEN=your_figma_token_here
```

Get your token from [Figma Settings](https://www.figma.com/developers/api#access-tokens).

### 3. Run (Web UI)

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000 and paste your Figma URL.

### 4. Run (CLI)

```bash
# Using a Figma URL
npm start -- --url "https://www.figma.com/file/FILE_KEY/Design-Name"

# Using just the file key
npm start -- --file FILE_KEY

# Generate only web code
npm start -- --url "..." --output web

# Generate only SwiftUI code
npm start -- --url "..." --output swift

# Generate specific node
npm start -- --url "https://www.figma.com/file/ABC...?node-id=1:2" --output both
```

## Project Structure

```
figma-code-generator/
├── src/                        # Core generator (Node.js CLI)
│   ├── api/
│   ├── parser/
│   ├── transformers/
│   ├── generators/
│   └── index.ts
├── web/                        # Web UI (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Main UI
│   │   │   └── api/
│   │   │       └── generate/   # API endpoint
│   │   └── components/
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

```
figma-code-generator/
├── src/
│   ├── api/                    # Figma API client & types
│   │   ├── figma-client.ts     # REST API client
│   │   └── figma-api-types.ts  # Figma API response types
│   ├── parser/                 # File parsing
│   │   └── figma-parser.ts     # Main parser
│   ├── transformers/           # Node transformation
│   │   └── node-transformer.ts # Figma node → internal AST
│   ├── generators/             # Code generators
│   │   ├── web/                # HTML/CSS generator
│   │   └── swift/              # SwiftUI generator
│   ├── types/                  # TypeScript types
│   │   └── figma-node.ts       # Internal AST types
│   └── index.ts                # Main entry point
├── templates/                  # Code templates
├── package.json
├── tsconfig.json
└── .env.example
```

## API Usage

```typescript
import { FigmaCodeGenerator } from './src/index';

const generator = new FigmaCodeGenerator('YOUR_FIGMA_TOKEN');

// From URL
const results = await generator.generateFromUrl(
  'https://www.figma.com/file/ABC123/Design',
  { output: 'both' }
);

// From file key
const results = await generator.generateFromKey('ABC123', undefined, {
  output: 'both'
});

// Results
results.web?.html  // Complete HTML file
results.web?.css   // CSS styles
results.swift      // SwiftUI code
```

## Supported Figma Features

### Node Types
- FRAME, GROUP, COMPONENT, INSTANCE
- TEXT, RECTANGLE, VECTOR, ELLIPSE
- BOOLEAN_OPERATION, STAR, LINE

### Layout Properties
- Auto-layout modes (HORIZONTAL, VERTICAL, GRID)
- Padding and item spacing
- Primary/counter axis alignment
- Wrap behavior

### Visual Styles
- Fills (solid colors, gradients, images)
- Strokes (borders)
- Corner radius
- Effects (shadows, blur)

### Typography
- Font family, size, weight
- Letter spacing, line height
- Text alignment

## Roadmap

- [ ] Image export for complex vectors
- [ ] Component instance resolution
- [ ] Design token extraction
- [ ] React/Vue component output
- [ ] Design system support
- [ ] Plugin integration

## License

MIT

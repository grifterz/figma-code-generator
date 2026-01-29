import dotenv from 'dotenv';
import { FigmaParser, createParser } from './parser/figma-parser';
import { WebGenerator } from './generators/web';
import { SwiftGenerator } from './generators/swift/swift-generator';
import { extractFileKey, extractNodeId } from './api/figma-client';
import { BaseNode } from './types/figma-node';

dotenv.config();

export interface CLIOptions {
  url?: string;
  fileKey?: string;
  nodeId?: string;
  output: 'web' | 'swift' | 'both';
  format?: 'html' | 'css' | 'swift';
  outputDir?: string;
}

export class FigmaCodeGenerator {
  private parser: FigmaParser;

  constructor(accessToken: string) {
    this.parser = new FigmaParser(accessToken);
  }

  /**
   * Generate code from a Figma file URL
   */
  async generateFromUrl(
    url: string,
    options: Omit<CLIOptions, 'url'>
  ): Promise<{ web?: { html: string; css: string }; swift?: string }> {
    const fileKey = extractFileKey(url);
    if (!fileKey) {
      throw new Error('Invalid Figma URL. Could not extract file key.');
    }

    const nodeId = options.nodeId || extractNodeId(url);

    return this.generateFromKey(fileKey, nodeId, options);
  }

  /**
   * Generate code from a Figma file key
   */
  async generateFromKey(
    fileKey: string,
    nodeId?: string,
    options: Omit<CLIOptions, 'url' | 'fileKey' | 'nodeId'> = { output: 'both' }
  ): Promise<{ web?: { html: string; css: string }; swift?: string }> {
    const results: { web?: { html: string; css: string }; swift?: string } = {};

    // Parse the file or specific node
    let node: BaseNode;
    if (nodeId) {
      node = await this.parser.parseNode(fileKey, nodeId);
    } else {
      const document = await this.parser.parseFile(fileKey);
      // Use the first frame from the first page as the default
      if (document.pages.length > 0 && document.pages[0].frames.length > 0) {
        node = document.pages[0].frames[0];
      } else {
        throw new Error('No frames found in the Figma file.');
      }
    }

    // Generate web code
    if (options.output === 'web' || options.output === 'both') {
      const webGenerator = new WebGenerator();
      const webResult = webGenerator.generate(node, { filename: 'figma-design' });
      results.web = { html: webResult.html, css: webResult.css };
    }

    // Generate Swift code
    if (options.output === 'swift' || options.output === 'both') {
      const swiftGenerator = new SwiftGenerator();
      const swiftResult = swiftGenerator.generate(node, { viewName: 'FigmaDesignView' });
      results.swift = swiftResult;
    }

    return results;
  }

  /**
   * Generate code from a parsed node
   */
  generateFromNode(
    node: BaseNode,
    options: Omit<CLIOptions, 'url' | 'fileKey' | 'nodeId'>
  ): { web?: { html: string; css: string }; swift?: string } {
    const results: { web?: { html: string; css: string }; swift?: string } = {};

    if (options.output === 'web' || options.output === 'both') {
      const webGenerator = new WebGenerator();
      const webResult = webGenerator.generate(node, { filename: 'figma-design' });
      results.web = { html: webResult.html, css: webResult.css };
    }

    if (options.output === 'swift' || options.output === 'both') {
      const swiftGenerator = new SwiftGenerator();
      const swiftResult = swiftGenerator.generate(node, { viewName: 'FigmaDesignView' });
      results.swift = swiftResult;
    }

    return results;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    url: undefined,
    output: 'both',
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-u':
      case '--url':
        options.url = args[++i];
        break;
      case '-f':
      case '--file':
        options.fileKey = args[++i];
        break;
      case '-n':
      case '--node':
        options.nodeId = args[++i];
        break;
      case '-o':
      case '--output':
        const outputValue = args[++i];
        if (['web', 'swift', 'both'].includes(outputValue)) {
          options.output = outputValue as 'web' | 'swift' | 'both';
        }
        break;
      case '-d':
      case '--dir':
        options.outputDir = args[++i];
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  // Check for required options
  if (!options.url && !options.fileKey) {
    console.error('Error: Please provide a Figma URL or file key.');
    printHelp();
    process.exit(1);
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.error('Error: FIGMA_ACCESS_TOKEN is not set in .env file.');
    console.error('Please create a .env file with your Figma API token.');
    process.exit(1);
  }

  try {
    const generator = new FigmaCodeGenerator(token);
    
    const results = options.url 
      ? await generator.generateFromUrl(options.url, options)
      : await generator.generateFromKey(options.fileKey!, options.nodeId, options);

    if (results.web) {
      console.log('\n=== WEB OUTPUT ===\n');
      console.log('HTML file generated successfully!');
      console.log(`Length: ${results.web.html.length} characters`);
      console.log(`CSS length: ${results.web.css.length} characters`);
      
      if (options.outputDir) {
        const fs = await import('fs');
        const path = await import('path');
        
        const htmlPath = path.join(options.outputDir, 'figma-design.html');
        const cssPath = path.join(options.outputDir, 'figma-design.css');
        
        fs.writeFileSync(htmlPath, results.web.html);
        fs.writeFileSync(cssPath, results.web.css);
        
        console.log(`\nFiles saved to:`);
        console.log(`  - ${htmlPath}`);
        console.log(`  - ${cssPath}`);
      } else {
        // Output to files in current directory
        const fs = await import('fs');
        fs.writeFileSync('figma-design.html', results.web.html);
        fs.writeFileSync('figma-design.css', results.web.css);
        console.log('\nFiles saved to: figma-design.html, figma-design.css');
      }
    }

    if (results.swift) {
      console.log('\n=== SWIFT OUTPUT ===\n');
      console.log('SwiftUI file generated successfully!');
      console.log(`Length: ${results.swift.length} characters`);
      
      const fs = await import('fs');
      const path = await import('path');
      
      if (options.outputDir) {
        const swiftPath = path.join(options.outputDir, 'FigmaDesignView.swift');
        fs.writeFileSync(swiftPath, results.swift);
        console.log(`\nFile saved to: ${swiftPath}`);
      } else {
        fs.writeFileSync('FigmaDesignView.swift', results.swift);
        console.log('\nFile saved to: FigmaDesignView.swift');
      }
    }

    console.log('\n✅ Generation complete!');
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Figma Code Generator
====================
Usage: npx figma-code-generator [options]

Options:
  -u, --url <url>        Figma file URL
  -f, --file <key>       Figma file key (alternative to URL)
  -n, --node <id>        Specific node ID to convert
  -o, --output <type>    Output type: web, swift, or both (default: both)
  -d, --dir <directory>  Output directory
  -h, --help             Show this help message

Examples:
  npx figma-code-generator --url "https://www.figma.com/file/ABC123..."
  npx figma-code-generator --file ABC123 --output web
  npx figma-code-generator --url "..." --node "1:2" --output swift

Environment:
  FIGMA_ACCESS_TOKEN    Your Figma API token (required)
`);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FigmaCodeGenerator, main as cliMain };

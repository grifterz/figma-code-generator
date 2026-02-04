'use client';

import { useState, useRef, useEffect } from 'react';

interface GenerateResponse {
  web?: {
    html: string;
    css: string;
  };
  swift?: string;
  error?: string;
}

export default function Home() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'render' | 'html' | 'css' | 'swift'>('render');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGenerate = async () => {
    if (!figmaUrl.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: figmaUrl }),
      });

      const data: GenerateResponse = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        setResult(data);
        setActiveTab('render');
      }
    } catch (error) {
      alert('Failed to generate code: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Render the HTML/CSS in iframe
  useEffect(() => {
    if (result?.web && activeTab === 'render' && iframeRef.current) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: system-ui, -apple-system, sans-serif; }
              ${result.web.css}
            </style>
          </head>
          <body>
            ${result.web.html}
          </body>
        </html>
      `;
      iframeRef.current.srcdoc = html;
    }
  }, [result, activeTab]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Figma Renderer
          </h1>
          <p className="mt-2 text-gray-600">
            Render Figma designs visually
          </p>
        </div>
      </header>

      {/* Input Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label htmlFor="figma-url" className="block text-sm font-medium text-gray-700 mb-2">
            Figma File URL
          </label>
          <div className="flex gap-4">
            <input
              type="url"
              id="figma-url"
              placeholder="https://www.figma.com/file/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !figmaUrl.trim()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Rendering...' : 'Render'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Paste your Figma file URL to render the design.
          </p>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('render')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'render'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Render
              </button>
              <button
                onClick={() => setActiveTab('html')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'html'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'css'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                CSS
              </button>
              <button
                onClick={() => setActiveTab('swift')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'swift'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                SwiftUI
              </button>
            </div>

            {/* Render Display */}
            {activeTab === 'render' && result.web && (
              <div className="bg-white" style={{ height: '600px' }}>
                <iframe
                  ref={iframeRef}
                  title="Figma Render"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts"
                />
              </div>
            )}

            {/* Code Display */}
            {activeTab === 'html' && result.web && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-auto">
                <pre className="text-green-400 text-sm">
                  <code>{result.web.html}</code>
                </pre>
              </div>
            )}
            {activeTab === 'css' && result.web && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-auto">
                <pre className="text-blue-400 text-sm">
                  <code>{result.web.css}</code>
                </pre>
              </div>
            )}
            {activeTab === 'swift' && result.swift && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-auto">
                <pre className="text-orange-400 text-sm">
                  <code>{result.swift}</code>
                </pre>
              </div>
            )}

            {/* Copy Button */}
            {activeTab !== 'render' && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    const code = activeTab === 'html' ? result.web?.html : 
                                 activeTab === 'css' ? result.web?.css : 
                                 result.swift;
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert('Copied to clipboard!');
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-sm text-gray-500">
          Figma Renderer • Built with Figma API
        </p>
      </footer>
    </main>
  );
}

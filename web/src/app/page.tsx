'use client';

import { useState, useRef, useEffect } from 'react';

interface GenerateResponse {
  web?: {
    html: string;
    css: string;
  };
  swift?: string;
  source?: 'api' | 'cache';
  cachedAt?: string;
  error?: string;
}

export default function Home() {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'render' | 'html' | 'css'>('render');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [cacheInfo, setCacheInfo] = useState<{ fileKey?: string; cachedAt?: string }>({});

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
        
        // Show cache status
        if (data.source === 'cache' && data.cachedAt) {
          console.log(`Loaded from cache: ${data.cachedAt}`);
          // Extract file key from URL for display
          const match = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
          if (match) {
            setCacheInfo({ fileKey: match[1], cachedAt: data.cachedAt });
          }
        }
      }
    } catch (error) {
      alert('Failed to generate: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Render HTML/CSS in iframe
  useEffect(() => {
    if (result?.web && activeTab === 'render' && iframeRef.current) {
      const { html } = result.web;
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
            Pixel-perfect Figma rendering
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
            First render: fetches from Figma API (uses 1 request)
            <br />
            Subsequent renders: uses local cache (no API calls)
          </p>
          
          {/* Cache Status */}
          {cacheInfo.fileKey && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ Loaded from cache • {cacheInfo.fileKey}
              </p>
            </div>
          )}
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
            </div>

            {/* Render Preview */}
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

            {/* HTML Code */}
            {activeTab === 'html' && result.web && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-auto">
                <pre className="text-green-400 text-sm whitespace-pre-wrap">
                  {result.web.html}
                </pre>
              </div>
            )}

            {/* CSS Code */}
            {activeTab === 'css' && result.web && (
              <div className="p-6 bg-gray-900 max-h-[600px] overflow-auto">
                <pre className="text-blue-400 text-sm whitespace-pre-wrap">
                  {result.web.css}
                </pre>
              </div>
            )}

            {/* Copy Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => {
                  if (result.web?.html) {
                    navigator.clipboard.writeText(result.web.html);
                    alert('HTML copied!');
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
              >
                Copy HTML
              </button>
              <button
                onClick={() => {
                  if (result.web?.css) {
                    navigator.clipboard.writeText(result.web.css);
                    alert('CSS copied!');
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300"
              >
                Copy CSS
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-sm text-gray-500">
          Figma Renderer • Cached development for fast iteration
        </p>
      </footer>
    </main>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import mermaid from 'mermaid';

interface DiagramRendererProps {
  diagram: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ 
  diagram, 
  isLoading = false, 
  onRefresh 
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      er: {
        entityPadding: 15,
        stroke: '#333',
        fill: '#f9f9f9',
        fontSize: 12,
      },
    });
  }, []);

  useEffect(() => {
    if (diagram && diagramRef.current) {
      renderDiagram();
    }
  }, [diagram]);

  const renderDiagram = async () => {
    if (!diagramRef.current || !diagram) return;

    setIsRendering(true);
    setError(null);

    try {
      // Clear previous content
      diagramRef.current.innerHTML = '';
      
      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}`;
      
      // Render the diagram
      const { svg } = await mermaid.render(id, diagram);
      diagramRef.current.innerHTML = svg;
      
      // Apply zoom
      const svgElement = diagramRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${zoom})`;
        svgElement.style.transformOrigin = 'top left';
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError('Failed to render diagram. Please check the diagram syntax.');
      diagramRef.current.innerHTML = `
        <div class="flex items-center justify-center h-64 text-muted-foreground">
          <div class="text-center">
            <p class="mb-2">Failed to render diagram</p>
            <p class="text-sm">${err instanceof Error ? err.message : 'Unknown error'}</p>
          </div>
        </div>
      `;
    } finally {
      setIsRendering(false);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 2);
    setZoom(newZoom);
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.4);
    setZoom(newZoom);
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      svgElement.style.transform = `scale(${newZoom})`;
    }
  };

  const handleDownload = () => {
    const svgElement = diagramRef.current?.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'database-diagram.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Entity Relationship Diagram
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Visual representation of your database schema and relationships
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Zoom: {Math.round(zoom * 100)}%
            </Badge>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating diagram...
            </div>
          </div>
        ) : diagram ? (
          <div className="relative overflow-auto border rounded-lg bg-white" style={{ maxHeight: '600px' }}>
            <div 
              ref={diagramRef} 
              className="p-4"
              style={{ minHeight: '200px' }}
            />
            {isRendering && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Rendering diagram...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">No diagram available</p>
              <p className="text-sm">Connect to a database to generate an ER diagram</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
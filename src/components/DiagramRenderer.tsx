import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import { initializeMermaid, renderDiagram } from '@/lib/mermaid';

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
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeMermaid();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (diagram && diagramRef.current && isInitialized) {
      renderDiagram(diagramRef.current, diagram);
    }
  }, [diagram, isInitialized]);

  const handleDownload = () => {
    if (diagramRef.current) {
      const svg = diagramRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
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
    }
  };

  const handleFullscreen = () => {
    if (diagramRef.current) {
      diagramRef.current.requestFullscreen();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Entity Relationship Diagram
          </CardTitle>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Generating diagram...
              </div>
            </div>
          ) : diagram ? (
            <div ref={diagramRef} className="w-full h-full flex justify-center" />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No diagram available. Connect to a database to generate one.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, RefreshCw, Loader2, Download } from 'lucide-react';
import mermaid from 'mermaid';

interface DiagramRendererProps {
  diagram: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  diagram,
  isLoading = false,
  onRefresh,
  isRefreshing = false
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      er: {
        fontSize: 12,
        useMaxWidth: true,
      }
    });
  }, []);

  useEffect(() => {
    if (diagram && diagramRef.current) {
      diagramRef.current.innerHTML = '';
      
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render('mermaid-diagram', diagram);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `
              <div class="flex items-center justify-center h-64 text-red-500">
                <p>Error rendering diagram</p>
              </div>
            `;
          }
        }
      };

      renderDiagram();
    }
  }, [diagram]);

  const handleDownload = () => {
    if (diagramRef.current) {
      const svg = diagramRef.current.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'er-diagram.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Entity Relationship Diagram
            </CardTitle>
            <CardDescription>
              Visual representation of database tables and their relationships
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download SVG
            </Button>
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
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
              Generating ER diagram...
            </div>
          </div>
        ) : diagram ? (
          <div className="border rounded-lg p-4 bg-white overflow-auto">
            <div ref={diagramRef} className="flex justify-center min-h-64" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/30">
            <div className="text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No diagram available</p>
              <p className="text-sm text-muted-foreground">
                Connect to a database to generate an ER diagram
              </p>
            </div>
          </div>
        )}
        
        {diagram && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline">Auto-generated</Badge>
            <Badge variant="outline">Mermaid.js</Badge>
            <span className="text-xs text-muted-foreground">
              Diagram updates automatically when schema changes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
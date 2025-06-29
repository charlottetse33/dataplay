import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, GitBranch, RefreshCw } from 'lucide-react';
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
    if (diagram && diagramRef.current && !isLoading && !isRefreshing) {
      const renderDiagram = async () => {
        try {
          diagramRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-diagram-${Date.now()}`, diagram);
          diagramRef.current!.innerHTML = svg;
        } catch (error) {
          console.error('Failed to render diagram:', error);
          diagramRef.current!.innerHTML = '<p class="text-red-500">Failed to render diagram</p>';
        }
      };
      
      renderDiagram();
    }
  }, [diagram, isLoading, isRefreshing]);

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
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isRefreshing ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {isRefreshing ? 'Refreshing diagram...' : 'Generating ER diagram...'}
            </div>
          </div>
        ) : diagram ? (
          <div className="w-full overflow-auto">
            <div ref={diagramRef} className="min-h-64" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No diagram available. Select a schema to generate an ER diagram.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
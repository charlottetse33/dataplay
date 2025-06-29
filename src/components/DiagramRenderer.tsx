import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, GitBranch } from 'lucide-react';
import mermaid from 'mermaid';

interface DiagramRendererProps {
  diagram: string;
  isLoading?: boolean;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ 
  diagram, 
  isLoading = false 
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
    if (diagram && diagramRef.current && !isLoading) {
      const renderDiagram = async () => {
        try {
          diagramRef.current!.innerHTML = '';
          const { svg } = await mermaid.render('mermaid-diagram', diagram);
          diagramRef.current!.innerHTML = svg;
        } catch (error) {
          console.error('Failed to render diagram:', error);
          diagramRef.current!.innerHTML = '<p class="text-red-500">Failed to render diagram</p>';
        }
      };
      
      renderDiagram();
    }
  }, [diagram, isLoading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Entity Relationship Diagram
        </CardTitle>
        <CardDescription>
          Visual representation of database tables and their relationships
        </CardDescription>
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
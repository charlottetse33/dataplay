import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, Clock, CheckCircle, XCircle, AlertTriangle, Play, Loader2 } from 'lucide-react';
import { Transformation } from '@/entities';
import { useToast } from '@/hooks/use-toast';

interface TransformationHistoryProps {
  connectionId: string;
  onExecuteTransformation: (transformationId: string) => Promise<boolean>;
}

export const TransformationHistory: React.FC<TransformationHistoryProps> = ({
  connectionId,
  onExecuteTransformation
}) => {
  const [transformations, setTransformations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTransformations();
  }, [connectionId]);

  const loadTransformations = async () => {
    try {
      setIsLoading(true);
      const data = await Transformation.filter(
        { connection_id: connectionId },
        '-created_at',
        20
      );
      setTransformations(data);
    } catch (error) {
      console.error('Failed to load transformations:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load transformation history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async (transformationId: string) => {
    setExecutingId(transformationId);
    try {
      const success = await onExecuteTransformation(transformationId);
      if (success) {
        // Reload transformations to get updated status
        await loadTransformations();
      }
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setExecutingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading transformation history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transformation History
        </CardTitle>
        <CardDescription>
          View and manage previous database transformations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transformations.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transformations yet</p>
            <p className="text-sm text-muted-foreground">
              Generate your first transformation to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transformations.map((transformation, index) => (
              <div key={transformation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transformation.execution_status)}
                    <Badge variant="secondary" className={getStatusColor(transformation.execution_status)}>
                      {transformation.execution_status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(transformation.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {transformation.execution_status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleExecute(transformation.id)}
                      disabled={executingId === transformation.id}
                    >
                      {executingId === transformation.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Request:</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {transformation.user_prompt}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Generated SQL:</h4>
                    <pre className="text-xs bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto">
                      <code>{transformation.generated_sql}</code>
                    </pre>
                  </div>

                  {transformation.execution_result && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">Result:</h4>
                      <p className={`text-sm p-2 rounded ${
                        transformation.execution_status === 'executed' 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        {transformation.execution_result}
                      </p>
                    </div>
                  )}

                  {transformation.affected_tables && transformation.affected_tables.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Affected tables:</span>
                      {transformation.affected_tables.map((table: string) => (
                        <Badge key={table} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {index < transformations.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
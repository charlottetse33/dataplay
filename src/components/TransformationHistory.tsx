import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Transformation } from '@/entities';
import { Clock, CheckCircle, XCircle, AlertCircle, Code, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransformationHistoryProps {
  connectionId: string;
  onExecuteTransformation?: (transformationId: string) => Promise<boolean>;
}

export const TransformationHistory: React.FC<TransformationHistoryProps> = ({
  connectionId,
  onExecuteTransformation
}) => {
  const [transformations, setTransformations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransformations = async () => {
    try {
      setIsLoading(true);
      const results = await Transformation.filter(
        { connection_id: connectionId },
        '-created_at',
        20
      );
      setTransformations(results);
    } catch (error) {
      console.error('Failed to fetch transformations:', error);
      toast({
        title: "Failed to Load History",
        description: "Could not load transformation history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connectionId) {
      fetchTransformations();
    }
  }, [connectionId]);

  const handleExecute = async (transformationId: string) => {
    if (!onExecuteTransformation) return;
    
    setExecutingId(transformationId);
    try {
      const success = await onExecuteTransformation(transformationId);
      if (success) {
        // Refresh the transformations list to show updated status
        await fetchTransformations();
      }
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setExecutingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>;
      case 'executed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Executed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-300">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transformation History</CardTitle>
          <CardDescription>Loading transformation history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Transformation History
        </CardTitle>
        <CardDescription>
          View and manage your database transformations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transformations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transformations found. Create your first transformation above.
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {transformations.map((transformation, index) => (
                <div key={transformation.id}>
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transformation.execution_status)}
                        {getStatusBadge(transformation.execution_status)}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(transformation.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-1">Request:</h4>
                        <p className="text-sm text-muted-foreground">{transformation.user_prompt}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-1">Generated SQL:</h4>
                        <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                          {transformation.generated_sql}
                        </code>
                      </div>
                      
                      {transformation.execution_result && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Result:</h4>
                          <p className={`text-xs p-2 rounded ${
                            transformation.execution_status === 'failed' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}>
                            {transformation.execution_result}
                          </p>
                        </div>
                      )}
                      
                      {transformation.affected_tables && transformation.affected_tables.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Affected Tables:</h4>
                          <div className="flex gap-1 flex-wrap">
                            {transformation.affected_tables.map((table: string) => (
                              <Badge key={table} variant="secondary" className="text-xs">
                                {table}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {transformation.execution_status === 'pending' && onExecuteTransformation && (
                        <Button
                          size="sm"
                          onClick={() => handleExecute(transformation.id)}
                          disabled={executingId === transformation.id}
                        >
                          {executingId === transformation.id ? 'Executing...' : 'Execute'}
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < transformations.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Wand2, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { Transformation } from '@/entities';

interface TransformationAgentProps {
  connectionId: string;
  onTransformationComplete?: () => void;
}

export const TransformationAgent: React.FC<TransformationAgentProps> = ({
  connectionId,
  onTransformationComplete
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTransformation, setCurrentTransformation] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [transformationHistory, setTransformationHistory] = useState<any[]>([]);

  const { generateTransformation, executeTransformation } = useDatabase();

  useEffect(() => {
    loadTransformationHistory();
  }, [connectionId]);

  const loadTransformationHistory = async () => {
    try {
      const history = await Transformation.filter(
        { connection_id: connectionId },
        '-created_at',
        10
      );
      setTransformationHistory(history);
    } catch (error) {
      console.error('Failed to load transformation history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const transformation = await generateTransformation(prompt, connectionId);
      setCurrentTransformation(transformation);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error('Failed to generate transformation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!currentTransformation) return;

    setIsExecuting(true);
    try {
      await executeTransformation(currentTransformation.id);
      setShowConfirmDialog(false);
      setCurrentTransformation(null);
      setPrompt('');
      await loadTransformationHistory();
      onTransformationComplete?.();
    } catch (error) {
      console.error('Failed to execute transformation:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Transformation Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI SQL Transformation
          </CardTitle>
          <CardDescription>
            Describe the database changes you want to make in plain English
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Add a 'phone' column to the users table, or Create an index on the email column for faster lookups..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <Button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating SQL...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate SQL Transformation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transformation History */}
      <Card>
        <CardHeader>
          <CardTitle>Transformation History</CardTitle>
          <CardDescription>
            Recent SQL transformations for this database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transformationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transformations yet. Generate your first SQL transformation above.
            </div>
          ) : (
            <div className="space-y-4">
              {transformationHistory.map((transformation) => (
                <div key={transformation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transformation.execution_status)}
                      <Badge variant="outline" className="capitalize">
                        {transformation.execution_status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(transformation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3">{transformation.user_prompt}</p>
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Generated SQL
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                      {transformation.generated_sql}
                    </pre>
                  </details>
                  
                  {transformation.execution_result && (
                    <Alert className="mt-3">
                      <AlertDescription className="text-sm">
                        {transformation.execution_result}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirm SQL Transformation"
        description={
          currentTransformation ? (
            <div className="space-y-4">
              <p><strong>Request:</strong> {currentTransformation.user_prompt}</p>
              
              {currentTransformation.explanation && (
                <p><strong>Explanation:</strong> {currentTransformation.explanation}</p>
              )}
              
              {currentTransformation.risk_level && (
                <div className={`p-3 rounded-lg border ${getRiskColor(currentTransformation.risk_level)}`}>
                  <strong>Risk Level: {currentTransformation.risk_level.toUpperCase()}</strong>
                </div>
              )}
              
              <div>
                <strong>Generated SQL:</strong>
                <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-x-auto">
                  {currentTransformation.generated_sql}
                </pre>
              </div>
              
              {currentTransformation.affected_tables?.length > 0 && (
                <p>
                  <strong>Affected Tables:</strong> {currentTransformation.affected_tables.join(', ')}
                </p>
              )}
            </div>
          ) : ''
        }
        confirmText="Execute Transformation"
        onConfirm={handleExecute}
        isLoading={isExecuting}
        variant={currentTransformation?.risk_level === 'high' ? 'destructive' : 'default'}
      />
    </div>
  );
};
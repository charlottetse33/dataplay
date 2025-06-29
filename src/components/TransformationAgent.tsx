import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Zap, Loader2, AlertTriangle, CheckCircle, XCircle, Code } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { Transformation } from '@/entities';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
      
      // Notify parent component that transformation is complete
      if (onTransformationComplete) {
        onTransformationComplete();
      }
    } catch (error) {
      console.error('Failed to execute transformation:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Loader2 className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Transformation Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Database Transformation
          </CardTitle>
          <CardDescription>
            Describe the changes you want to make to your database schema in plain English
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Add a 'phone_number' column to the users table, or Create an index on the email column for faster lookups"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-24"
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
                <Zap className="h-4 w-4 mr-2" />
                Generate Transformation
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
            Recent database transformations for this connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transformationHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transformations yet. Generate your first transformation above.
            </div>
          ) : (
            <div className="space-y-4">
              {transformationHistory.map((transformation, index) => (
                <div key={transformation.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transformation.execution_status)}
                      <span className="font-medium">
                        {transformation.user_prompt}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(transformation.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  {transformation.generated_sql && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Code className="h-4 w-4" />
                        <span className="text-sm font-medium">Generated SQL:</span>
                      </div>
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                        {transformation.generated_sql}
                      </pre>
                    </div>
                  )}
                  
                  {transformation.execution_result && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Result:</strong> {transformation.execution_result}
                    </div>
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
        title="Confirm Database Transformation"
        description={
          currentTransformation ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2"><strong>Request:</strong> {currentTransformation.user_prompt}</p>
                <p className="mb-2"><strong>Explanation:</strong> {currentTransformation.explanation}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Risk Level:</span>
                  <Badge className={getRiskColor(currentTransformation.risk_level)}>
                    {currentTransformation.risk_level?.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="mb-2">
                  <span className="text-sm font-medium">Affected Tables:</span>
                  <div className="flex gap-1 mt-1">
                    {currentTransformation.affected_tables?.map((table: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Generated SQL:</p>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-32">
                  {currentTransformation.generated_sql}
                </pre>
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  This is a demo environment. The transformation will update the mock schema data.
                </span>
              </div>
            </div>
          ) : null
        }
        confirmText="Execute Transformation"
        onConfirm={handleExecute}
        isLoading={isExecuting}
        variant="default"
      />
    </div>
  );
};
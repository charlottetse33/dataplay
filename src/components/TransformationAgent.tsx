import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, AlertTriangle, CheckCircle, XCircle, Zap, Code } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { Transformation } from '@/entities';
import { TransformationShortcuts } from './TransformationShortcuts';

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
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTransformation, setCurrentTransformation] = useState<any>(null);
  const [transformationHistory, setTransformationHistory] = useState<any[]>([]);
  const [currentSchema, setCurrentSchema] = useState<any>(null);

  const { generateTransformation, executeTransformation, schema } = useDatabase();

  useEffect(() => {
    setCurrentSchema(schema);
  }, [schema]);

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
      await loadTransformationHistory();
    } catch (error) {
      console.error('Failed to generate transformation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!currentTransformation) return;

    if (currentTransformation.execution_status === 'failed' || currentTransformation.is_validation_failed) {
      return;
    }

    setIsExecuting(true);
    try {
      await executeTransformation(currentTransformation.id);
      await loadTransformationHistory();
      setCurrentTransformation(null);
      setPrompt('');
      onTransformationComplete?.();
    } catch (error) {
      console.error('Failed to execute transformation:', error);
      await loadTransformationHistory();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleShortcutSelect = (shortcutPrompt: string) => {
    setPrompt(shortcutPrompt);
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
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Transformation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI SQL Transformation
              </CardTitle>
              <CardDescription>
                Describe the database changes you want to make in plain English. The AI will generate the appropriate SQL code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Transformation Request
                </label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Add a phone_number column to the users table, or Create an index on the email column..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating SQL...
                    </>
                  ) : (
                    <>
                      <Code className="h-4 w-4 mr-2" />
                      Generate SQL
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentTransformation && (
            <Card className={currentTransformation.execution_status === 'failed' || currentTransformation.is_validation_failed ? "border-red-200" : "border-blue-200"}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {currentTransformation.execution_status === 'failed' || currentTransformation.is_validation_failed ? 'Validation Failed' : 'Generated SQL Transformation'}
                  </span>
                  <Badge className={getRiskColor(currentTransformation.risk_level)}>
                    {currentTransformation.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentTransformation.explanation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {currentTransformation.generated_sql}
                  </pre>
                </div>

                {(currentTransformation.execution_status === 'failed' || currentTransformation.is_validation_failed) && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {currentTransformation.execution_result || currentTransformation.explanation}
                    </AlertDescription>
                  </Alert>
                )}

                {currentTransformation.affected_tables?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Affected Tables:</p>
                    <div className="flex gap-2 flex-wrap">
                      {currentTransformation.affected_tables.map((table: string, index: number) => (
                        <Badge key={index} variant="outline">{table}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!currentTransformation.execution_status || (currentTransformation.execution_status !== 'failed' && !currentTransformation.is_validation_failed) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This is a demo environment. The SQL will be simulated and schema changes will be applied to the mock database.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  {!currentTransformation.execution_status || (currentTransformation.execution_status !== 'failed' && !currentTransformation.is_validation_failed) ? (
                    <Button 
                      onClick={handleExecute} 
                      disabled={isExecuting}
                      className="flex-1"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Execute Transformation
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCurrentTransformation(null);
                        setPrompt('');
                      }}
                      className="flex-1"
                    >
                      Try Different Request
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTransformation(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <TransformationShortcuts 
            onShortcutSelect={handleShortcutSelect}
            currentSchema={currentSchema}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transformation History</CardTitle>
              <CardDescription>
                Recent SQL transformations for this database connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transformationHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No transformations yet. Generate your first SQL transformation!
                </p>
              ) : (
                <div className="space-y-4">
                  {transformationHistory.map((transformation) => (
                    <div key={transformation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transformation.execution_status)}
                          <span className="font-medium text-sm">
                            {transformation.user_prompt}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(transformation.created_at).toLocaleString()}
                        </Badge>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded text-sm font-mono mb-2">
                        {transformation.generated_sql}
                      </div>
                      
                      {transformation.execution_result && (
                        <p className="text-sm text-gray-600">
                          {transformation.execution_result}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
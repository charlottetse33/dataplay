import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDatabase } from '@/hooks/useDatabase';
import { TransformationHistory } from './TransformationHistory';
import { TransformationShortcuts } from './TransformationShortcuts';
import { Zap, Code, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransformationAgentProps {
  connectionId: string;
  currentSchema?: any;
  onTransformationComplete?: () => void;
}

export const TransformationAgent: React.FC<TransformationAgentProps> = ({
  connectionId,
  currentSchema,
  onTransformationComplete
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTransformation, setCurrentTransformation] = useState<any>(null);
  const { generateTransformation, executeTransformation } = useDatabase();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe the transformation you want to perform.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const transformation = await generateTransformation(prompt, connectionId);
      setCurrentTransformation(transformation);
      toast({
        title: "Transformation Generated",
        description: "SQL transformation has been generated. Review and execute when ready.",
      });
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async (transformationId?: string) => {
    const idToExecute = transformationId || currentTransformation?.id;
    if (!idToExecute) return false;

    setIsExecuting(true);
    try {
      const success = await executeTransformation(idToExecute);
      
      if (success) {
        // Only call onTransformationComplete if execution was successful
        if (onTransformationComplete) {
          onTransformationComplete();
        }
        
        // Clear current transformation after successful execution
        if (!transformationId) {
          setCurrentTransformation(null);
          setPrompt('');
        }
      }
      
      return success;
    } catch (error) {
      console.error('Execution failed:', error);
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleShortcutSelect = (shortcutPrompt: string) => {
    setPrompt(shortcutPrompt);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'text-green-600 border-green-300';
      case 'medium':
        return 'text-yellow-600 border-yellow-300';
      case 'high':
        return 'text-red-600 border-red-300';
      default:
        return 'text-gray-600 border-gray-300';
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
                AI Database Transformation
              </CardTitle>
              <CardDescription>
                Describe the changes you want to make to your database schema in plain English.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                  Transformation Request
                </label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Add a phone number column to the users table, Create an index on the email column, Add a new products table with name and price columns..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating SQL...
                  </>
                ) : (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Generate SQL Transformation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {currentTransformation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Generated Transformation
                </CardTitle>
                <CardDescription>
                  Review the generated SQL before executing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Request:</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                    {currentTransformation.user_prompt}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Generated SQL:</h4>
                  <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded overflow-x-auto">
                    <code>{currentTransformation.generated_sql}</code>
                  </pre>
                </div>

                {currentTransformation.explanation && (
                  <div>
                    <h4 className="font-medium mb-2">Explanation:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                      {currentTransformation.explanation}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  {currentTransformation.risk_level && (
                    <Badge variant="outline" className={getRiskColor(currentTransformation.risk_level)}>
                      {currentTransformation.risk_level.toUpperCase()} RISK
                    </Badge>
                  )}
                  
                  {currentTransformation.affected_tables && currentTransformation.affected_tables.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Affects:</span>
                      {currentTransformation.affected_tables.map((table: string) => (
                        <Badge key={table} variant="secondary">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">
                    This will modify your database schema. Please review carefully before executing.
                  </span>
                </div>

                <Button 
                  onClick={() => handleExecute()}
                  disabled={isExecuting}
                  className="w-full"
                  variant={currentTransformation.risk_level === 'high' ? 'destructive' : 'default'}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing Transformation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Execute Transformation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <TransformationShortcuts 
            onShortcutSelect={handleShortcutSelect}
            currentSchema={currentSchema}
          />
        </TabsContent>

        <TabsContent value="history">
          <TransformationHistory 
            connectionId={connectionId}
            onExecuteTransformation={handleExecute}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
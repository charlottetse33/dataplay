import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { ConfirmationDialog } from './ConfirmationDialog';

interface TransformationAgentProps {
  connectionId: string;
  onTransformationComplete: () => void;
}

export const TransformationAgent: React.FC<TransformationAgentProps> = ({ 
  connectionId, 
  onTransformationComplete 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTransformation, setGeneratedTransformation] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const { generateTransformation, executeTransformation } = useDatabase();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const transformation = await generateTransformation(prompt, connectionId);
      setGeneratedTransformation(transformation);
    } catch (error) {
      console.error('Failed to generate transformation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!generatedTransformation) return;

    setIsExecuting(true);
    try {
      await executeTransformation(generatedTransformation.id);
      setShowConfirmation(false);
      setGeneratedTransformation(null);
      setPrompt('');
      onTransformationComplete();
    } catch (error) {
      console.error('Failed to execute transformation:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const examplePrompts = [
    "Split the full_name column into first_name and last_name",
    "Add an index on the email column for better performance",
    "Create a new status column with default value 'active'",
    "Add a foreign key constraint between orders and products",
    "Rename the 'total_amount' column to 'total_price'"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Transformation Agent
          </CardTitle>
          <CardDescription>
            Describe the database transformation you want to perform, and I'll generate the SQL code for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Transformation Request</label>
            <Textarea
              placeholder="Describe what you want to change in your database schema..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Example prompts:</label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(example)}
                  className="text-xs h-auto py-1 px-2"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

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
                Generate Transformation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedTransformation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated SQL Transformation</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getRiskColor(generatedTransformation.risk_level)}>
                  {generatedTransformation.risk_level || 'Unknown'} Risk
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Explanation</label>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {generatedTransformation.explanation}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Generated SQL</label>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto">
                {generatedTransformation.generated_sql}
              </pre>
            </div>

            {generatedTransformation.affected_tables && generatedTransformation.affected_tables.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Affected Tables</label>
                <div className="flex flex-wrap gap-2">
                  {generatedTransformation.affected_tables.map((table: string, index: number) => (
                    <Badge key={index} variant="secondary">{table}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setGeneratedTransformation(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowConfirmation(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Execute Transformation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        title="Execute SQL Transformation"
        description="Are you sure you want to execute this SQL transformation? This action cannot be undone."
        confirmText="Execute"
        onConfirm={handleExecute}
        isLoading={isExecuting}
        variant="destructive"
      />
    </div>
  );
};
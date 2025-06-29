import React, { useState, useEffect } from 'react';
import { DiagramRenderer } from '@/components/DiagramRenderer';
import { TransformationAgent } from '@/components/TransformationAgent';
import { SchemaViewer } from '@/components/SchemaViewer';
import { SchemaSelector } from '@/components/SchemaSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Zap, GitBranch, ArrowLeft, Loader2 } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { SchemaSnapshot } from '@/entities';

const Index = () => {
  const [currentView, setCurrentView] = useState<'selector' | 'dashboard'>('selector');
  const [latestSnapshot, setLatestSnapshot] = useState<any>(null);
  
  const { 
    currentConnection, 
    schema, 
    isIntrospecting, 
    loadMockSchema,
    setCurrentConnection 
  } = useDatabase();

  const handleSchemaSelect = async (connectionId: string, mockData: any) => {
    try {
      const schemaData = await loadMockSchema(connectionId, mockData);
      setCurrentView('dashboard');
      
      // Load the latest snapshot for diagram rendering
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: connectionId }, 
        '-snapshot_date', 
        1
      );
      if (snapshots.length > 0) {
        setLatestSnapshot(snapshots[0]);
      }
    } catch (error) {
      console.error('Failed to load mock schema:', error);
    }
  };

  const handleBackToSelector = () => {
    setCurrentConnection(null);
    setCurrentView('selector');
    setLatestSnapshot(null);
  };

  const handleTransformationComplete = async () => {
    // Refresh schema snapshot after transformation
    if (currentConnection) {
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: currentConnection.id }, 
        '-snapshot_date', 
        1
      );
      if (snapshots.length > 0) {
        setLatestSnapshot(snapshots[0]);
      }
    }
  };

  if (currentView === 'selector') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Database Agent Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore AI database transformations with sample schemas. Generate ER diagrams and test intelligent SQL transformations.
            </p>
          </div>
          
          <SchemaSelector onSchemaSelect={handleSchemaSelect} />
          
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Multiple Database Types</CardTitle>
                <CardDescription>
                  Explore PostgreSQL, MySQL, and SQL Server schemas with realistic data structures.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <GitBranch className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Auto-Generated ER Diagrams</CardTitle>
                <CardDescription>
                  Beautiful entity relationship diagrams generated automatically from database schemas.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI SQL Transformations</CardTitle>
                <CardDescription>
                  Describe changes in plain English and get database-specific SQL with safety confirmations.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {currentConnection?.name}
              </Badge>
              <Badge variant="outline">
                {currentConnection?.database_type?.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                Demo Mode
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBackToSelector}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schemas
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagram">ER Diagram</TabsTrigger>
            <TabsTrigger value="schema">Schema Details</TabsTrigger>
            <TabsTrigger value="transform">AI Transformations</TabsTrigger>
          </TabsList>

          <TabsContent value="diagram" className="space-y-6">
            <DiagramRenderer
              diagram={latestSnapshot?.mermaid_diagram || ''}
              isLoading={isIntrospecting}
            />
          </TabsContent>

          <TabsContent value="schema" className="space-y-6">
            {schema ? (
              <SchemaViewer schema={schema} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  {isIntrospecting ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading schema data...
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">No schema data available.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transform" className="space-y-6">
            {currentConnection ? (
              <TransformationAgent
                connectionId={currentConnection.id}
                onTransformationComplete={handleTransformationComplete}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No database connection available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
import React, { useState, useEffect } from 'react';
import { DiagramRenderer } from '@/components/DiagramRenderer';
import { TransformationAgent } from '@/components/TransformationAgent';
import { SchemaViewer } from '@/components/SchemaViewer';
import { SchemaSelector } from '@/components/SchemaSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Zap, GitBranch, ArrowLeft, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { SchemaSnapshot } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<'selector' | 'dashboard'>('selector');
  const [latestSnapshot, setLatestSnapshot] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [originalSchema, setOriginalSchema] = useState<any>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const { toast } = useToast();
  
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
      setOriginalSchema(mockData.schema); // Store original schema for reset
      
      // Load the latest snapshot for diagram rendering
      await fetchLatestSnapshot();
    } catch (error) {
      console.error('Failed to load mock schema:', error);
    }
  };

  const fetchLatestSnapshot = async () => {
    if (!currentConnection) return;
    
    setIsRefreshing(true);
    setSnapshotError(null);
    
    try {
      console.log('Fetching latest snapshot for connection:', currentConnection.id);
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: currentConnection.id }, 
        '-snapshot_date', 
        1
      );
      if (snapshots.length > 0) {
        setLatestSnapshot(snapshots[0]);
        console.log('Fetched latest snapshot:', snapshots[0]);
        toast({
          title: "Schema Refreshed",
          description: `Updated with latest schema data from ${new Date(snapshots[0].snapshot_date).toLocaleTimeString()}`,
        });
      } else {
        console.log('No snapshots found for connection');
        setSnapshotError('No schema snapshots found for this connection.');
      }
    } catch (error) {
      console.warn('Failed to fetch latest snapshot:', error);
      setSnapshotError('Unable to fetch schema data. This may be due to network connectivity issues.');
      
      // Don't show error toast for network issues, just log it
      console.log('Using fallback schema data from current connection');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBackToSelector = () => {
    setCurrentConnection(null);
    setCurrentView('selector');
    setLatestSnapshot(null);
    setOriginalSchema(null);
  };

  const handleTransformationComplete = async () => {
    console.log('Transformation completed successfully, fetching latest snapshot...');
    // Only fetch latest schema snapshot after SUCCESSFUL transformation
    await fetchLatestSnapshot();
  };

  const handleResetDemo = async () => {
    if (!currentConnection || !originalSchema) return;
    
    setIsResetting(true);
    try {
      // Reload the original schema
      await loadMockSchema(currentConnection.id, {
        connection: currentConnection,
        schema: originalSchema
      });
      
      // Fetch the latest snapshot
      await fetchLatestSnapshot();
      
      toast({
        title: "Demo Reset",
        description: "Database schema has been reset to its original state.",
      });
    } catch (error) {
      console.error('Failed to reset demo:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset the demo database.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Auto-fetch latest snapshot when schema changes
  useEffect(() => {
    if (currentConnection && schema) {
      fetchLatestSnapshot();
    }
  }, [schema]);

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

  // Get the current schema data to display - prioritize latest snapshot, fallback to schema
  const currentSchemaData = latestSnapshot ? {
    tables: latestSnapshot.tables,
    relationships: latestSnapshot.relationships
  } : schema;

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
              {latestSnapshot && (
                <Badge variant="outline" className="text-xs">
                  Last updated: {new Date(latestSnapshot.snapshot_date).toLocaleTimeString()}
                </Badge>
              )}
              {snapshotError && (
                <Badge variant="destructive" className="text-xs">
                  Offline Mode
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleResetDemo}
              disabled={isResetting || !originalSchema}
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Demo
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleBackToSelector}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Schemas
            </Button>
          </div>
        </div>

        {/* Network Status Alert */}
        {snapshotError && (
          <Alert className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              {snapshotError} The application is running in offline mode with cached data.
            </AlertDescription>
          </Alert>
        )}

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
              isLoading={isIntrospecting || isRefreshing}
              onRefresh={fetchLatestSnapshot}
              isRefreshing={isRefreshing}
            />
          </TabsContent>

          <TabsContent value="schema" className="space-y-6">
            {currentSchemaData ? (
              <SchemaViewer 
                schema={currentSchemaData}
                onRefresh={fetchLatestSnapshot}
                isRefreshing={isRefreshing}
              />
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
                currentSchema={currentSchemaData}
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

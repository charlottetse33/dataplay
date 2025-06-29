import React, { useState, useEffect } from 'react';
import { DatabaseConnectionForm } from '@/components/DatabaseConnectionForm';
import { DiagramRenderer } from '@/components/DiagramRenderer';
import { TransformationAgent } from '@/components/TransformationAgent';
import { SchemaViewer } from '@/components/SchemaViewer';
import { SchemaSelector } from '@/components/SchemaSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Zap, GitBranch, Settings, Loader2, Play } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { DatabaseConnection, SchemaSnapshot } from '@/entities';

const Index = () => {
  const [currentView, setCurrentView] = useState<'connect' | 'demo' | 'dashboard'>('connect');
  const [latestSnapshot, setLatestSnapshot] = useState<any>(null);
  
  const { 
    currentConnection, 
    schema, 
    isIntrospecting, 
    introspectSchema,
    loadMockSchema,
    setCurrentConnection 
  } = useDatabase();

  useEffect(() => {
    // Check for existing connections on load
    const loadExistingConnection = async () => {
      try {
        const connections = await DatabaseConnection.list('-last_connected', 1);
        if (connections.length > 0) {
          const connection = connections[0];
          setCurrentConnection(connection);
          setCurrentView('dashboard');
          
          // Load latest schema snapshot
          const snapshots = await SchemaSnapshot.filter(
            { connection_id: connection.id }, 
            '-snapshot_date', 
            1
          );
          if (snapshots.length > 0) {
            setLatestSnapshot(snapshots[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load existing connection:', error);
      }
    };

    loadExistingConnection();
  }, [setCurrentConnection]);

  const handleConnectionSuccess = async (connection: any) => {
    setCurrentConnection(connection);
    setCurrentView('dashboard');
    
    // Automatically introspect schema after connection
    try {
      await introspectSchema(connection.id);
    } catch (error) {
      console.error('Failed to introspect schema:', error);
    }
  };

  const handleSchemaSelect = async (connectionId: string, mockData: any) => {
    try {
      await loadMockSchema(connectionId, mockData);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Failed to load mock schema:', error);
    }
  };

  const handleSchemaRefresh = async () => {
    if (currentConnection) {
      await introspectSchema(currentConnection.id);
    }
  };

  const handleTransformationComplete = async () => {
    // Refresh schema after transformation
    await handleSchemaRefresh();
  };

  const handleNewConnection = () => {
    setCurrentConnection(null);
    setCurrentView('connect');
    setLatestSnapshot(null);
  };

  const handleTryDemo = () => {
    setCurrentView('demo');
  };

  if (currentView === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Database Agent
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect to your database (PostgreSQL, MySQL, SQLite, MongoDB, SQL Server) and let AI agents generate diagrams and perform intelligent transformations.
            </p>
          </div>
          
          <div className="flex justify-center gap-4 mb-8">
            <Button onClick={handleTryDemo} size="lg" className="bg-primary hover:bg-primary/90">
              <Play className="h-5 w-5 mr-2" />
              Try Demo with Sample Data
            </Button>
          </div>
          
          <DatabaseConnectionForm onConnectionSuccess={handleConnectionSuccess} />
          
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Multi-Database Support</CardTitle>
                <CardDescription>
                  Connect to PostgreSQL, MySQL, SQLite, MongoDB, and SQL Server databases with full SSL support.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <GitBranch className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Schema Visualization</CardTitle>
                <CardDescription>
                  Automatically generate beautiful ER diagrams from your database schema across different database types.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Transformations</CardTitle>
                <CardDescription>
                  Describe changes in plain English and get database-specific SQL transformations with confirmation.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'demo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Demo Mode</h1>
              <p className="text-gray-600 mt-2">Explore AI database transformations with sample schemas</p>
            </div>
            <Button variant="outline" onClick={() => setCurrentView('connect')}>
              Back to Connection
            </Button>
          </div>
          
          <SchemaSelector onSchemaSelect={handleSchemaSelect} />
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
                {currentConnection?.database}@{currentConnection?.host || 'local'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleNewConnection}>
              <Settings className="h-4 w-4 mr-2" />
              New Connection
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
              onRefresh={handleSchemaRefresh}
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
                      Analyzing database schema...
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">No schema data available.</p>
                      <Button onClick={handleSchemaRefresh}>
                        Analyze Schema
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transform" className="space-y-6">
            {currentConnection ? (
              currentConnection.database_type === 'mongodb' ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">SQL transformations are not supported for MongoDB.</p>
                      <p className="text-sm text-muted-foreground">MongoDB uses document-based operations instead of SQL.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <TransformationAgent
                  connectionId={currentConnection.id}
                  onTransformationComplete={handleTransformationComplete}
                />
              )
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
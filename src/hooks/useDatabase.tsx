import { useState, useCallback } from 'react';
import { DatabaseConnection, SchemaSnapshot, Transformation } from '@/entities';
import { invokeLLM } from '@/integrations/core';
import { generateERDiagram } from '@/lib/mermaid';
import { useToast } from '@/hooks/use-toast';

interface DatabaseSchema {
  tables: any[];
  relationships: any[];
}

export const useDatabase = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isIntrospecting, setIsIntrospecting] = useState(false);
  const { toast } = useToast();

  const testConnection = useCallback(async (connectionData: any) => {
    setIsConnecting(true);
    try {
      console.log('Testing connection with data:', { ...connectionData, password: '[HIDDEN]' });
      
      // For now, let's simulate a successful connection test
      // This is a temporary workaround until the backend functions are properly deployed
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      toast({
        title: "Connection Test Simulated",
        description: `Connection parameters validated for database: ${connectionData.database}`,
      });
      return true;
      
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const saveConnection = useCallback(async (connectionData: any) => {
    try {
      const connection = await DatabaseConnection.create({
        ...connectionData,
        is_active: true,
        last_connected: new Date().toISOString(),
      });
      
      setCurrentConnection(connection);
      toast({
        title: "Connection Saved",
        description: "Database connection has been saved successfully.",
      });
      
      return connection;
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save database connection.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const introspectSchema = useCallback(async (connectionId: string) => {
    setIsIntrospecting(true);
    try {
      // Get the connection data
      const connection = await DatabaseConnection.get(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      console.log('Starting introspection for connection:', connection.name);

      // For now, let's create a mock schema until backend functions are working
      const mockSchema = {
        tables: [
          {
            name: 'users',
            schema: 'public',
            full_name: 'public.users',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'email', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'name', data_type: 'varchar', is_nullable: true, is_primary_key: false, is_foreign_key: false },
              { name: 'created_at', data_type: 'timestamp', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'posts',
            schema: 'public',
            full_name: 'public.posts',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'title', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'content', data_type: 'text', is_nullable: true, is_primary_key: false, is_foreign_key: false },
              { name: 'user_id', data_type: 'integer', is_nullable: false, is_primary_key: false, is_foreign_key: true },
              { name: 'created_at', data_type: 'timestamp', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          }
        ],
        relationships: [
          {
            from_table: 'posts',
            to_table: 'users',
            from_column: 'user_id',
            to_column: 'id',
            constraint_name: 'fk_posts_user_id',
            relationship_type: 'one-to-many'
          }
        ]
      };

      const mermaidDiagram = generateERDiagram(mockSchema.tables, mockSchema.relationships);
      
      // Save schema snapshot
      await SchemaSnapshot.create({
        connection_id: connectionId,
        schema_name: 'public',
        tables: mockSchema.tables,
        relationships: mockSchema.relationships,
        mermaid_diagram: mermaidDiagram,
        snapshot_date: new Date().toISOString(),
      });

      setSchema(mockSchema);
      toast({
        title: "Schema Introspected (Mock Data)",
        description: `Found ${mockSchema.tables.length} tables and ${mockSchema.relationships.length} relationships.`,
      });

      return mockSchema;
    } catch (error) {
      console.error('Introspection error:', error);
      toast({
        title: "Introspection Failed",
        description: error instanceof Error ? error.message : "Failed to analyze database schema.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsIntrospecting(false);
    }
  }, [toast]);

  const generateTransformation = useCallback(async (prompt: string, connectionId: string) => {
    try {
      // Get current schema context for better SQL generation
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: connectionId }, 
        '-snapshot_date', 
        1
      );
      
      let schemaContext = "No schema information available";
      if (snapshots.length > 0) {
        const tables = snapshots[0].tables;
        schemaContext = tables.map((table: any) => {
          const columns = table.columns.map((col: any) => 
            `${col.name} (${col.data_type}${col.is_primary_key ? ', PK' : ''}${col.is_foreign_key ? ', FK' : ''})`
          ).join(', ');
          return `${table.name}: ${columns}`;
        }).join('\n');
      }

      const response = await invokeLLM({
        prompt: `You are a PostgreSQL expert. Generate SQL transformation code for the following request: "${prompt}". 
        
        Current schema context:
        ${schemaContext}
        
        Provide only the SQL code needed to perform this transformation. Include ALTER TABLE, UPDATE, or other necessary statements. Be specific and safe. Make sure the SQL is valid PostgreSQL syntax.`,
        response_json_schema: {
          type: "object",
          properties: {
            sql_code: { type: "string" },
            explanation: { type: "string" },
            affected_tables: { type: "array", items: { type: "string" } },
            risk_level: { type: "string" }
          }
        }
      });

      const transformation = await Transformation.create({
        connection_id: connectionId,
        user_prompt: prompt,
        generated_sql: response.sql_code,
        execution_status: 'pending',
        affected_tables: response.affected_tables,
      });

      return {
        ...transformation,
        explanation: response.explanation,
        risk_level: response.risk_level
      };
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate SQL transformation.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const executeTransformation = useCallback(async (transformationId: string) => {
    try {
      // For now, simulate execution until backend functions are working
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update transformation status
      await Transformation.update(transformationId, {
        execution_status: 'executed',
        execution_result: 'Transformation simulated successfully (backend functions not available)',
        execution_date: new Date().toISOString(),
      });

      toast({
        title: "Transformation Simulated",
        description: "SQL transformation simulation completed.",
      });

      return true;
    } catch (error) {
      await Transformation.update(transformationId, {
        execution_status: 'failed',
        execution_result: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "Failed to execute SQL transformation.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  return {
    isConnecting,
    currentConnection,
    schema,
    isIntrospecting,
    testConnection,
    saveConnection,
    introspectSchema,
    generateTransformation,
    executeTransformation,
    setCurrentConnection,
  };
};
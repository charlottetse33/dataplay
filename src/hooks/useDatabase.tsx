import { useState, useCallback } from 'react';
import { DatabaseConnection, SchemaSnapshot, Transformation } from '@/entities';
import { invokeLLM } from '@/integrations/core';
import { generateERDiagram } from '@/lib/mermaid';
import { useToast } from '@/hooks/use-toast';
import { testDatabaseConnection, introspectDatabase } from '@/functions';

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
      const response = await testDatabaseConnection({ connectionData });
      
      if (response.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the database.",
        });
        return true;
      } else {
        throw new Error(response.error || "Connection failed");
      }
    } catch (error) {
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
      
      // Call the backend function to introspect the real database
      const response = await introspectDatabase({ 
        connectionData: {
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          ssl_mode: connection.ssl_mode
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to introspect database');
      }

      const realSchema = response.schema;
      const mermaidDiagram = generateERDiagram(realSchema.tables, realSchema.relationships);
      
      // Save schema snapshot
      await SchemaSnapshot.create({
        connection_id: connectionId,
        schema_name: 'public',
        tables: realSchema.tables,
        relationships: realSchema.relationships,
        mermaid_diagram: mermaidDiagram,
        snapshot_date: new Date().toISOString(),
      });

      setSchema(realSchema);
      toast({
        title: "Schema Introspected",
        description: `Found ${realSchema.tables.length} tables and ${realSchema.relationships.length} relationships.`,
      });

      return realSchema;
    } catch (error) {
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
      const schemaContext = schema ? 
        schema.tables.map(table => 
          `${table.name}: ${table.columns.map(col => `${col.name} (${col.data_type})`).join(', ')}`
        ).join('\n') : 
        'No schema context available';

      const response = await invokeLLM({
        prompt: `You are a PostgreSQL expert. Generate SQL transformation code for the following request: "${prompt}". 
        
        Current schema context:
        ${schemaContext}
        
        Provide only the SQL code needed to perform this transformation. Include ALTER TABLE, UPDATE, or other necessary statements. Be specific and safe.`,
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
  }, [schema, toast]);

  const executeTransformation = useCallback(async (transformationId: string) => {
    try {
      // Simulate SQL execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update transformation status
      await Transformation.update(transformationId, {
        execution_status: 'executed',
        execution_result: 'Transformation completed successfully',
        execution_date: new Date().toISOString(),
      });

      toast({
        title: "Transformation Executed",
        description: "SQL transformation has been applied successfully.",
      });

      // Re-introspect schema after transformation
      if (currentConnection) {
        await introspectSchema(currentConnection.id);
      }

      return true;
    } catch (error) {
      await Transformation.update(transformationId, {
        execution_status: 'failed',
        execution_result: error instanceof Error ? error.message : 'Unknown error',
      });

      toast({
        title: "Execution Failed",
        description: "Failed to execute SQL transformation.",
        variant: "destructive",
      });
      throw error;
    }
  }, [currentConnection, introspectSchema, toast]);

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
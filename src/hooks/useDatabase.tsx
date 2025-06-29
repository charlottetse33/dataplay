import { useState, useCallback } from 'react';
import { DatabaseConnection, SchemaSnapshot, Transformation } from '@/entities';
import { invokeLLM } from '@/integrations/core';
import { generateERDiagram } from '@/lib/mermaid';
import { useToast } from '@/hooks/use-toast';
import { testDatabaseConnection, introspectDatabase, executeSqlTransformation } from '@/functions';

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
      const response = await testDatabaseConnection({ connectionData });
      
      console.log('Connection test response:', response);
      
      if (response.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to database: ${response.details?.database || connectionData.database}`,
        });
        return true;
      } else {
        throw new Error(response.error || "Connection failed");
      }
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

      console.log('Introspection response:', response);

      if (!response.success) {
        throw new Error(response.error || "Failed to introspect database");
      }

      const { schema: dbSchema } = response;
      const mermaidDiagram = generateERDiagram(dbSchema.tables, dbSchema.relationships);
      
      // Save schema snapshot
      await SchemaSnapshot.create({
        connection_id: connectionId,
        schema_name: dbSchema.schemas ? dbSchema.schemas.join(', ') : 'public',
        tables: dbSchema.tables,
        relationships: dbSchema.relationships,
        mermaid_diagram: mermaidDiagram,
        snapshot_date: new Date().toISOString(),
      });

      setSchema(dbSchema);
      toast({
        title: "Schema Introspected",
        description: `Found ${dbSchema.tables.length} tables and ${dbSchema.relationships.length} relationships.`,
      });

      return dbSchema;
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
      // Get the transformation and connection data
      const transformation = await Transformation.get(transformationId);
      if (!transformation) {
        throw new Error("Transformation not found");
      }

      const connection = await DatabaseConnection.get(transformation.connection_id);
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Execute the SQL transformation on the real database
      const response = await executeSqlTransformation({
        connectionData: {
          host: connection.host,
          port: connection.port,
          database: connection.database,
          username: connection.username,
          password: connection.password,
          ssl_mode: connection.ssl_mode
        },
        sqlCode: transformation.generated_sql
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to execute transformation");
      }

      // Update transformation status
      await Transformation.update(transformationId, {
        execution_status: 'executed',
        execution_result: response.result || 'Transformation completed successfully',
        execution_date: new Date().toISOString(),
      });

      toast({
        title: "Transformation Executed",
        description: "SQL transformation has been applied successfully.",
      });

      // Re-introspect schema after transformation to get updated structure
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
        description: error instanceof Error ? error.message : "Failed to execute SQL transformation.",
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

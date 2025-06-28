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
      // Simulate connection test - in a real app, this would connect to PostgreSQL
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll simulate a successful connection
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the database.",
        });
        return true;
      } else {
        throw new Error("Connection failed: Invalid credentials or unreachable host");
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
      // Simulate schema introspection - in a real app, this would query PostgreSQL
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock schema data for demonstration
      const mockSchema = {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false },
              { name: 'email', data_type: 'varchar', is_primary_key: false, is_nullable: false },
              { name: 'full_name', data_type: 'varchar', is_primary_key: false, is_nullable: true },
              { name: 'created_at', data_type: 'timestamp', is_primary_key: false, is_nullable: false },
            ]
          },
          {
            name: 'orders',
            columns: [
              { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false },
              { name: 'user_id', data_type: 'integer', is_primary_key: false, is_nullable: false, is_foreign_key: true },
              { name: 'total_amount', data_type: 'decimal', is_primary_key: false, is_nullable: false },
              { name: 'status', data_type: 'varchar', is_primary_key: false, is_nullable: false },
              { name: 'created_at', data_type: 'timestamp', is_primary_key: false, is_nullable: false },
            ]
          },
          {
            name: 'products',
            columns: [
              { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false },
              { name: 'name', data_type: 'varchar', is_primary_key: false, is_nullable: false },
              { name: 'price', data_type: 'decimal', is_primary_key: false, is_nullable: false },
              { name: 'description', data_type: 'text', is_primary_key: false, is_nullable: true },
            ]
          }
        ],
        relationships: [
          {
            from_table: 'users',
            to_table: 'orders',
            constraint_name: 'fk_orders_user_id',
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
        title: "Schema Introspected",
        description: "Database schema has been analyzed successfully.",
      });

      return mockSchema;
    } catch (error) {
      toast({
        title: "Introspection Failed",
        description: "Failed to analyze database schema.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsIntrospecting(false);
    }
  }, [toast]);

  const generateTransformation = useCallback(async (prompt: string, connectionId: string) => {
    try {
      const response = await invokeLLM({
        prompt: `You are a PostgreSQL expert. Generate SQL transformation code for the following request: "${prompt}". 
        
        Current schema context:
        - users table: id (PK), email, full_name, created_at
        - orders table: id (PK), user_id (FK), total_amount, status, created_at
        - products table: id (PK), name, price, description
        
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
  }, [toast]);

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
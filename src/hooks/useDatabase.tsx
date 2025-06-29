import { useState, useCallback } from 'react';
import { SchemaSnapshot, Transformation } from '@/entities';
import { invokeLLM } from '@/integrations/core';
import { generateERDiagram } from '@/lib/mermaid';
import { useToast } from '@/hooks/use-toast';
import { getSchemaForConnection } from '@/lib/mockData';

interface DatabaseSchema {
  tables: any[];
  relationships: any[];
}

export const useDatabase = () => {
  const [currentConnection, setCurrentConnection] = useState<any>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isIntrospecting, setIsIntrospecting] = useState(false);
  const { toast } = useToast();

  const loadMockSchema = useCallback(async (connectionId: string, mockData: any) => {
    setIsIntrospecting(true);
    try {
      console.log('Loading mock schema for connection:', connectionId);

      const schemaData = mockData.schema;
      const connection = mockData.connection;
      setCurrentConnection(connection);

      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mermaidDiagram = generateERDiagram(schemaData.tables, schemaData.relationships);
      
      await SchemaSnapshot.create({
        connection_id: connectionId,
        schema_name: 'public',
        tables: schemaData.tables,
        relationships: schemaData.relationships,
        mermaid_diagram: mermaidDiagram,
        snapshot_date: new Date().toISOString(),
      });

      setSchema(schemaData);
      toast({
        title: "Schema Loaded",
        description: `Generated ER diagram with ${schemaData.tables.length} tables and ${schemaData.relationships.length} relationships.`,
      });

      return schemaData;
    } catch (error) {
      console.error('Schema loading error:', error);
      toast({
        title: "Schema Load Failed",
        description: error instanceof Error ? error.message : "Failed to load database schema.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsIntrospecting(false);
    }
  }, [toast]);

  const generateTransformation = useCallback(async (prompt: string, connectionId: string) => {
    try {
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: connectionId }, 
        '-snapshot_date', 
        1
      );
      
      let schemaContext = "No schema information available";
      let databaseType = "postgresql";
      
      if (snapshots.length > 0) {
        const tables = snapshots[0].tables;
        schemaContext = tables.map((table: any) => {
          const columns = table.columns.map((col: any) => 
            `${col.name} (${col.data_type}${col.is_primary_key ? ', PK' : ''}${col.is_foreign_key ? ', FK' : ''})`
          ).join(', ');
          return `${table.name}: ${columns}`;
        }).join('\n');
      }

      // Get database type from current connection
      if (currentConnection) {
        databaseType = currentConnection.database_type;
      }

      const response = await invokeLLM({
        prompt: `You are a ${databaseType.toUpperCase()} expert. Generate SQL transformation code for the following request: "${prompt}". 
        
        Current schema context:
        ${schemaContext}
        
        Database type: ${databaseType}
        
        Provide only the SQL code needed to perform this transformation. Include ALTER TABLE, UPDATE, or other necessary statements. Be specific and safe. Make sure the SQL is valid ${databaseType} syntax.
        
        Also assess the risk level (low, medium, high) based on the potential impact of this transformation.`,
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
  }, [toast, currentConnection]);

  const executeTransformation = useCallback(async (transformationId: string) => {
    try {
      const transformation = await Transformation.get(transformationId);
      if (!transformation) {
        throw new Error("Transformation not found");
      }

      // Simulate SQL execution delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful execution
      await Transformation.update(transformationId, {
        execution_status: 'executed',
        execution_result: 'Demo transformation completed successfully. In a real environment, this would execute the SQL against your database.',
        execution_date: new Date().toISOString(),
      });

      toast({
        title: "Transformation Executed (Demo)",
        description: "SQL transformation has been simulated successfully.",
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
    currentConnection,
    schema,
    isIntrospecting,
    generateTransformation,
    executeTransformation,
    setCurrentConnection,
    loadMockSchema,
  };
};
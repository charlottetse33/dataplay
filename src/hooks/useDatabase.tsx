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

      // Update local schema state
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

  const validateSqlOperation = useCallback((sqlCode: string, currentSchema: any) => {
    const sqlLower = sqlCode.toLowerCase();
    const errors: string[] = [];

    // Validate ALTER TABLE operations
    if (sqlLower.includes('alter table')) {
      const tableMatch = sqlCode.match(/alter table\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const table = currentSchema.tables.find((t: any) => t.name.toLowerCase() === tableName.toLowerCase());
        
        if (!table) {
          errors.push(`Table '${tableName}' does not exist in the current schema`);
        } else {
          // Validate DROP COLUMN
          if (sqlLower.includes('drop column')) {
            const dropMatch = sqlCode.match(/drop column\s+(\w+)/i);
            if (dropMatch) {
              const columnName = dropMatch[1];
              const column = table.columns.find((c: any) => c.name.toLowerCase() === columnName.toLowerCase());
              if (!column) {
                errors.push(`Column '${columnName}' does not exist in table '${tableName}'`);
              }
            }
          }
          
          // Validate ADD COLUMN (check for duplicates)
          if (sqlLower.includes('add column')) {
            const addMatch = sqlCode.match(/add column\s+(\w+)/i);
            if (addMatch) {
              const columnName = addMatch[1];
              const column = table.columns.find((c: any) => c.name.toLowerCase() === columnName.toLowerCase());
              if (column) {
                errors.push(`Column '${columnName}' already exists in table '${tableName}'`);
              }
            }
          }

          // Validate RENAME COLUMN
          if (sqlLower.includes('rename column')) {
            const renameMatch = sqlCode.match(/rename column\s+(\w+)\s+to\s+(\w+)/i);
            if (renameMatch) {
              const [, oldName, newName] = renameMatch;
              const oldColumn = table.columns.find((c: any) => c.name.toLowerCase() === oldName.toLowerCase());
              const newColumn = table.columns.find((c: any) => c.name.toLowerCase() === newName.toLowerCase());
              
              if (!oldColumn) {
                errors.push(`Column '${oldName}' does not exist in table '${tableName}'`);
              }
              if (newColumn) {
                errors.push(`Column '${newName}' already exists in table '${tableName}'`);
              }
            }
          }
        }
      }
    }

    // Validate CREATE TABLE (check for duplicates)
    if (sqlLower.includes('create table')) {
      const createMatch = sqlCode.match(/create table\s+(\w+)/i);
      if (createMatch) {
        const tableName = createMatch[1];
        const existingTable = currentSchema.tables.find((t: any) => t.name.toLowerCase() === tableName.toLowerCase());
        if (existingTable) {
          errors.push(`Table '${tableName}' already exists in the schema`);
        }
      }
    }

    return errors;
  }, []);

  const applySchemaChanges = useCallback(async (sqlCode: string, connectionId: string) => {
    try {
      // Get the current schema
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: connectionId }, 
        '-snapshot_date', 
        1
      );
      
      if (snapshots.length === 0) {
        throw new Error("No schema snapshot found");
      }

      let updatedSchema = JSON.parse(JSON.stringify(snapshots[0])); // Deep clone
      let changeDescription = "";

      // Validate the SQL operation first
      const validationErrors = validateSqlOperation(sqlCode, updatedSchema);
      if (validationErrors.length > 0) {
        throw new Error(`SQL validation failed: ${validationErrors.join(', ')}`);
      }

      // Parse SQL and apply changes to mock schema
      const sqlLower = sqlCode.toLowerCase();
      
      if (sqlLower.includes('alter table') && sqlLower.includes('add column')) {
        // Handle ADD COLUMN
        const addColumnMatch = sqlCode.match(/alter table\s+(\w+)\s+add column\s+(\w+)\s+(\w+)/i);
        if (addColumnMatch) {
          const [, tableName, columnName, dataType] = addColumnMatch;
          const table = updatedSchema.tables.find((t: any) => t.name.toLowerCase() === tableName.toLowerCase());
          if (table) {
            table.columns.push({
              name: columnName,
              data_type: dataType.toLowerCase(),
              is_nullable: true,
              is_primary_key: false,
              is_foreign_key: false
            });
            changeDescription = `Added column '${columnName}' to table '${tableName}'`;
          }
        }
      } else if (sqlLower.includes('create table')) {
        // Handle CREATE TABLE
        const createTableMatch = sqlCode.match(/create table\s+(\w+)\s*\((.*?)\)/is);
        if (createTableMatch) {
          const [, tableName, columnsStr] = createTableMatch;
          const columns = [];
          
          // Parse columns (simplified parsing)
          const columnDefs = columnsStr.split(',').map(col => col.trim());
          for (const colDef of columnDefs) {
            const parts = colDef.trim().split(/\s+/);
            if (parts.length >= 2) {
              columns.push({
                name: parts[0],
                data_type: parts[1].toLowerCase(),
                is_nullable: !colDef.toLowerCase().includes('not null'),
                is_primary_key: colDef.toLowerCase().includes('primary key'),
                is_foreign_key: false
              });
            }
          }
          
          updatedSchema.tables.push({
            name: tableName,
            columns: columns
          });
          changeDescription = `Created new table '${tableName}' with ${columns.length} columns`;
        }
      } else if (sqlLower.includes('create index')) {
        // Handle CREATE INDEX
        const indexMatch = sqlCode.match(/create index\s+(\w+)\s+on\s+(\w+)\s*\((\w+)\)/i);
        if (indexMatch) {
          const [, indexName, tableName, columnName] = indexMatch;
          changeDescription = `Created index '${indexName}' on ${tableName}.${columnName}`;
        }
      } else if (sqlLower.includes('alter table') && sqlLower.includes('rename column')) {
        // Handle RENAME COLUMN
        const renameMatch = sqlCode.match(/alter table\s+(\w+)\s+rename column\s+(\w+)\s+to\s+(\w+)/i);
        if (renameMatch) {
          const [, tableName, oldName, newName] = renameMatch;
          const table = updatedSchema.tables.find((t: any) => t.name.toLowerCase() === tableName.toLowerCase());
          if (table) {
            const column = table.columns.find((c: any) => c.name.toLowerCase() === oldName.toLowerCase());
            if (column) {
              column.name = newName;
              changeDescription = `Renamed column '${oldName}' to '${newName}' in table '${tableName}'`;
            }
          }
        }
      } else if (sqlLower.includes('alter table') && sqlLower.includes('drop column')) {
        // Handle DROP COLUMN
        const dropMatch = sqlCode.match(/alter table\s+(\w+)\s+drop column\s+(\w+)/i);
        if (dropMatch) {
          const [, tableName, columnName] = dropMatch;
          const table = updatedSchema.tables.find((t: any) => t.name.toLowerCase() === tableName.toLowerCase());
          if (table) {
            const originalLength = table.columns.length;
            table.columns = table.columns.filter((c: any) => c.name.toLowerCase() !== columnName.toLowerCase());
            if (table.columns.length < originalLength) {
              changeDescription = `Dropped column '${columnName}' from table '${tableName}'`;
            }
          }
        }
      }

      // Generate new ER diagram with updated schema
      const newMermaidDiagram = generateERDiagram(updatedSchema.tables, updatedSchema.relationships);
      
      // Create new snapshot with updated schema
      await SchemaSnapshot.create({
        connection_id: connectionId,
        schema_name: updatedSchema.schema_name,
        tables: updatedSchema.tables,
        relationships: updatedSchema.relationships,
        mermaid_diagram: newMermaidDiagram,
        snapshot_date: new Date().toISOString(),
      });

      // Update local state with the new schema
      setSchema({
        tables: updatedSchema.tables,
        relationships: updatedSchema.relationships
      });

      console.log('Schema updated successfully:', changeDescription);
      return changeDescription || "Schema updated successfully";
    } catch (error) {
      console.error('Failed to apply schema changes:', error);
      throw error;
    }
  }, [validateSqlOperation]);

  const generateTransformation = useCallback(async (prompt: string, connectionId: string) => {
    try {
      const snapshots = await SchemaSnapshot.filter(
        { connection_id: connectionId }, 
        '-snapshot_date', 
        1
      );
      
      let schemaContext = "No schema information available";
      let databaseType = "postgresql";
      let currentSchemaData = null;
      
      if (snapshots.length > 0) {
        currentSchemaData = snapshots[0];
        const tables = snapshots[0].tables;
        schemaContext = tables.map((table: any) => {
          const columns = table.columns.map((col: any) => 
            `${col.name} (${col.data_type}${col.is_primary_key ? ', PK' : ''}${col.is_foreign_key ? ', FK' : ''})`
          ).join(', ');
          return `Table: ${table.name}\nColumns: ${columns}`;
        }).join('\n\n');
      }

      // Get database type from current connection
      if (currentConnection) {
        databaseType = currentConnection.database_type;
      }

      const response = await invokeLLM({
        prompt: `You are a ${databaseType.toUpperCase()} expert. Generate SQL transformation code for the following request: "${prompt}". 

CURRENT DATABASE SCHEMA:
${schemaContext}

Database type: ${databaseType}

CRITICAL VALIDATION RULES:
1. ONLY reference tables and columns that exist in the current schema above
2. DO NOT add columns that already exist
3. DO NOT drop columns that don't exist
4. DO NOT create tables that already exist
5. Carefully check the current schema before generating any SQL

EXAMPLES OF WHAT TO AVOID:
- If 'phone_number' already exists in 'users' table, DO NOT generate "ALTER TABLE users ADD COLUMN phone_number"
- If 'description' doesn't exist in 'products' table, DO NOT generate "ALTER TABLE products DROP COLUMN description"

Generate ONLY valid SQL that respects the current schema state. If the requested operation cannot be performed (e.g., adding an existing column), explain why in the explanation field and provide an alternative suggestion.

Provide the SQL code, explanation, affected tables, and risk level.`,
        response_json_schema: {
          type: "object",
          properties: {
            sql_code: { type: "string" },
            explanation: { type: "string" },
            affected_tables: { type: "array", items: { type: "string" } },
            risk_level: { type: "string" },
            is_valid: { type: "boolean" },
            validation_message: { type: "string" }
          }
        }
      });

      // CRITICAL: Validate the generated SQL against the current schema BEFORE creating the transformation
      if (currentSchemaData) {
        const validationErrors = validateSqlOperation(response.sql_code, currentSchemaData);
        if (validationErrors.length > 0) {
          console.warn('SQL validation failed:', validationErrors.join(', '));
          
          // Create a failed transformation record
          const transformation = await Transformation.create({
            connection_id: connectionId,
            user_prompt: prompt,
            generated_sql: response.sql_code,
            execution_status: 'failed',
            execution_result: `SQL validation failed: ${validationErrors.join(', ')}. Please modify your request to work with the current schema.`,
            affected_tables: response.affected_tables || [],
          });

          // Return the failed transformation
          return {
            ...transformation,
            explanation: `Cannot execute this transformation: ${validationErrors.join(', ')}. Please check the current schema and modify your request.`,
            risk_level: 'high',
            validation_errors: validationErrors,
            is_validation_failed: true
          };
        }
      }

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
        risk_level: response.risk_level,
        is_validation_failed: false
      };
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate SQL transformation.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, currentConnection, validateSqlOperation]);

  const executeTransformation = useCallback(async (transformationId: string) => {
    try {
      const transformation = await Transformation.get(transformationId);
      if (!transformation) {
        throw new Error("Transformation not found");
      }

      // Simulate SQL execution delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Apply the schema changes to mock data
      const changeDescription = await applySchemaChanges(
        transformation.generated_sql, 
        transformation.connection_id
      );

      // Update transformation status
      await Transformation.update(transformationId, {
        execution_status: 'executed',
        execution_result: `Demo transformation completed successfully. ${changeDescription}. The schema has been updated and the ER diagram regenerated.`,
        execution_date: new Date().toISOString(),
      });

      toast({
        title: "Transformation Executed (Demo)",
        description: `SQL transformation completed. ${changeDescription}`,
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
  }, [applySchemaChanges, toast]);

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
import { superdevClient } from "@/lib/superdev/client";

// Map to the exact function names as they appear in the functions folder (kebab-case)
export const testDatabaseConnection = superdevClient.functions["test-database-connection"];
export const introspectDatabase = superdevClient.functions["introspect-database"]; 
export const executeSqlTransformation = superdevClient.functions["execute-sql-transformation"];
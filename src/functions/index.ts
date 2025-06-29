import { superdevClient } from "@/lib/superdev/client";

// Import functions using kebab-case names as they appear in the functions folder
export const testDatabaseConnection = superdevClient.functions["test-database-connection"];
export const introspectDatabase = superdevClient.functions["introspect-database"];
export const executeSqlTransformation = superdevClient.functions["execute-sql-transformation"];
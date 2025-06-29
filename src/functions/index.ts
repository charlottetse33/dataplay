import { superdevClient } from "@/lib/superdev/client";

// Database connection and introspection functions
export const testDatabaseConnection = superdevClient.functions["test-database-connection"];
export const introspectDatabase = superdevClient.functions["introspect-database"];
export const executeSqlTransformation = superdevClient.functions["execute-sql-transformation"];

// Add other functions as they become available
// Example: export const otherFunction = superdevClient.functions["other-function"];
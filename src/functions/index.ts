import { superdevClient } from "@/lib/superdev/client";

// The functions should be accessed with camelCase names that match the kebab-case file names
export const testDatabaseConnection = superdevClient.functions.testDatabaseConnection;
export const executeSqlTransformation = superdevClient.functions.executeSqlTransformation;
export const introspectDatabase = superdevClient.functions.introspectDatabase;
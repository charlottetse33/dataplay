import { superdevClient } from "@/lib/superdev/client";

export const testDatabaseConnection = superdevClient.functions.testDatabaseConnection;
export const introspectDatabase = superdevClient.functions.introspectDatabase;
export const executeSqlTransformation = superdevClient.functions.executeSqlTransformation;

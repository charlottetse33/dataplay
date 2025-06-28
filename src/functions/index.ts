import { superdevClient } from "@/lib/superdev/client";

export const introspectDatabase = superdevClient.functions.introspectDatabase;
export const testDatabaseConnection = superdevClient.functions.testDatabaseConnection;

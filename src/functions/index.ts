import { superdevClient } from "@/lib/superdev/client";

// Try direct function calls using the superdev client
export const testDatabaseConnection = async (params: any) => {
  return await superdevClient.request('POST', `/functions/test-database-connection`, params);
};

export const introspectDatabase = async (params: any) => {
  return await superdevClient.request('POST', `/functions/introspect-database`, params);
};

export const executeSqlTransformation = async (params: any) => {
  return await superdevClient.request('POST', `/functions/execute-sql-transformation`, params);
};
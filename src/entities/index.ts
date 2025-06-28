import { superdevClient } from "@/lib/superdev/client";

export const DatabaseConnection = superdevClient.entity("DatabaseConnection");
export const SchemaSnapshot = superdevClient.entity("SchemaSnapshot");
export const Transformation = superdevClient.entity("Transformation");
export const User = superdevClient.auth;

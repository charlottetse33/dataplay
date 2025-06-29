import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Key, Link, RefreshCw, Loader2 } from 'lucide-react';

interface SchemaViewerProps {
  schema: {
    tables: any[];
    relationships: any[];
  };
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ 
  schema, 
  onRefresh,
  isRefreshing = false 
}) => {
  return (
    <div className="space-y-6">
      {/* Tables Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Tables ({schema.tables.length})
              </CardTitle>
              <CardDescription>
                Detailed view of all tables and their column definitions
              </CardDescription>
            </div>
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {schema.tables.map((table, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{table.name}</h3>
                <Badge variant="outline">{table.columns.length} columns</Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Nullable</TableHead>
                    <TableHead>Keys</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.columns.map((column: any, colIndex: number) => (
                    <TableRow key={colIndex}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{column.data_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {column.is_nullable ? (
                          <Badge variant="outline">Nullable</Badge>
                        ) : (
                          <Badge variant="destructive">Not Null</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {column.is_primary_key && (
                            <Badge variant="default" className="text-xs">
                              <Key className="h-3 w-3 mr-1" />
                              PK
                            </Badge>
                          )}
                          {column.is_foreign_key && (
                            <Badge variant="outline" className="text-xs">
                              <Link className="h-3 w-3 mr-1" />
                              FK
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Relationships ({schema.relationships.length})
          </CardTitle>
          <CardDescription>
            Foreign key relationships between tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From Table</TableHead>
                <TableHead>To Table</TableHead>
                <TableHead>Relationship Type</TableHead>
                <TableHead>Constraint Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema.relationships.map((rel, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rel.from_table}</TableCell>
                  <TableCell className="font-medium">{rel.to_table}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rel.relationship_type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rel.constraint_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
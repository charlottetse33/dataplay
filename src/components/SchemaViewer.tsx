import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Key, Link } from 'lucide-react';

interface SchemaViewerProps {
  schema: {
    tables: any[];
    relationships: any[];
  };
}

export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const getColumnIcon = (column: any) => {
    if (column.is_primary_key) return <Key className="h-4 w-4 text-yellow-500" />;
    if (column.is_foreign_key) return <Link className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getColumnBadge = (column: any) => {
    if (column.is_primary_key) return <Badge variant="secondary" className="text-xs">PK</Badge>;
    if (column.is_foreign_key) return <Badge variant="outline" className="text-xs">FK</Badge>;
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Database Schema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="tables" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tables">Tables ({schema.tables.length})</TabsTrigger>
            <TabsTrigger value="relationships">Relationships ({schema.relationships.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tables" className="space-y-4">
            {schema.tables.map((table, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Nullable</TableHead>
                        <TableHead>Key</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.columns.map((column: any, colIndex: number) => (
                        <TableRow key={colIndex}>
                          <TableCell className="flex items-center gap-2">
                            {getColumnIcon(column)}
                            <span className="font-medium">{column.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {column.data_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={column.is_nullable ? "secondary" : "destructive"} className="text-xs">
                              {column.is_nullable ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getColumnBadge(column)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="relationships" className="space-y-4">
            {schema.relationships.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From Table</TableHead>
                    <TableHead>To Table</TableHead>
                    <TableHead>Constraint</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schema.relationships.map((rel, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rel.from_table}</TableCell>
                      <TableCell className="font-medium">{rel.to_table}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {rel.constraint_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {rel.relationship_type || 'one-to-many'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No relationships found in the database schema.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Eye, RefreshCw, Loader2 } from 'lucide-react';

interface SampleDataViewerProps {
  schema: {
    tables: any[];
    relationships: any[];
  };
  connectionId: string;
}

export const SampleDataViewer: React.FC<SampleDataViewerProps> = ({ 
  schema, 
  connectionId 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Generate realistic sample data based on table schema
  const generateSampleData = (table: any) => {
    const sampleCount = 5; // Show 5 sample rows
    const data = [];

    for (let i = 1; i <= sampleCount; i++) {
      const row: any = {};
      
      table.columns.forEach((column: any) => {
        const columnName = column.name.toLowerCase();
        const dataType = column.data_type.toLowerCase();
        
        // Generate data based on column name and type
        if (column.is_primary_key) {
          row[column.name] = i;
        } else if (columnName.includes('email')) {
          row[column.name] = `user${i}@example.com`;
        } else if (columnName.includes('name') && !columnName.includes('user')) {
          if (table.name === 'users') {
            row[column.name] = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][i - 1];
          } else if (table.name === 'products') {
            row[column.name] = ['Wireless Headphones', 'Smartphone Case', 'Laptop Stand', 'USB Cable', 'Bluetooth Speaker'][i - 1];
          } else if (table.name === 'categories') {
            row[column.name] = ['Electronics', 'Accessories', 'Computers', 'Audio', 'Mobile'][i - 1];
          } else {
            row[column.name] = `Sample ${column.name} ${i}`;
          }
        } else if (columnName.includes('price') || columnName.includes('amount')) {
          row[column.name] = (Math.random() * 100 + 10).toFixed(2);
        } else if (columnName.includes('quantity')) {
          row[column.name] = Math.floor(Math.random() * 10) + 1;
        } else if (columnName.includes('status')) {
          if (table.name === 'orders') {
            row[column.name] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i - 1];
          } else {
            row[column.name] = ['active', 'inactive', 'pending', 'active', 'active'][i - 1];
          }
        } else if (columnName.includes('created_at') || columnName.includes('updated_at') || dataType.includes('timestamp')) {
          const date = new Date();
          date.setDate(date.getDate() - (5 - i));
          row[column.name] = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        } else if (columnName.includes('user_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('product_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('category_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 3) + 1;
        } else if (columnName.includes('order_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (dataType.includes('boolean') || dataType.includes('bool')) {
          row[column.name] = Math.random() > 0.5;
        } else if (dataType.includes('int') || dataType.includes('number')) {
          row[column.name] = Math.floor(Math.random() * 100) + 1;
        } else if (columnName.includes('description') || columnName.includes('bio') || columnName.includes('notes')) {
          if (table.name === 'products') {
            row[column.name] = [
              'High-quality wireless headphones with noise cancellation',
              'Durable smartphone case with drop protection',
              'Adjustable laptop stand for better ergonomics',
              'Fast charging USB-C cable, 6ft length',
              'Portable bluetooth speaker with rich bass'
            ][i - 1];
          } else if (table.name === 'users') {
            row[column.name] = [
              'Software developer passionate about technology',
              'Marketing specialist with 5 years experience',
              'Product manager focused on user experience',
              'Designer creating beautiful digital experiences',
              'Data analyst turning insights into action'
            ][i - 1];
          } else {
            row[column.name] = `Sample description for ${table.name} ${i}`;
          }
        } else if (columnName.includes('phone')) {
          row[column.name] = `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        } else if (columnName.includes('url') || columnName.includes('avatar')) {
          row[column.name] = `https://example.com/${columnName}/${i}.jpg`;
        } else if (columnName.includes('sku')) {
          row[column.name] = `SKU-${String(i).padStart(4, '0')}`;
        } else if (dataType.includes('varchar') || dataType.includes('text') || dataType.includes('string')) {
          row[column.name] = `Sample ${column.name} ${i}`;
        } else {
          row[column.name] = `Value ${i}`;
        }
      });
      
      data.push(row);
    }
    
    return data;
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const formatCellValue = (value: any, column: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">NULL</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'TRUE' : 'FALSE'}
        </Badge>
      );
    }
    
    if (column.name.toLowerCase().includes('email')) {
      return <span className="text-blue-600">{value}</span>;
    }
    
    if (column.name.toLowerCase().includes('price') || column.name.toLowerCase().includes('amount')) {
      return <span className="font-mono text-green-600">${value}</span>;
    }
    
    if (column.name.toLowerCase().includes('status')) {
      const statusColors: any = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
      };
      return (
        <Badge variant="secondary" className={statusColors[value] || 'bg-gray-100 text-gray-800'}>
          {value.toUpperCase()}
        </Badge>
      );
    }
    
    if (column.data_type.toLowerCase().includes('timestamp') || column.name.toLowerCase().includes('_at')) {
      return <span className="text-gray-600 font-mono text-sm">{value}</span>;
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return (
        <span className="text-sm" title={value}>
          {value.substring(0, 50)}...
        </span>
      );
    }
    
    return <span>{value}</span>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Sample Data ({schema.tables.length} tables)
              </CardTitle>
              <CardDescription>
                Preview sample data from each table to understand the database structure
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshData}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={schema.tables[0]?.name} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {schema.tables.slice(0, 3).map((table) => (
                <TabsTrigger key={table.name} value={table.name} className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {table.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {schema.tables.map((table) => {
              const sampleData = generateSampleData(table);
              
              return (
                <TabsContent key={table.name} value={table.name} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{table.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {table.columns.length} columns • {sampleData.length} sample rows
                      </p>
                    </div>
                    <Badge variant="outline">
                      Demo Data
                    </Badge>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          {table.columns.map((column: any) => (
                            <TableHead key={column.name} className="font-semibold">
                              <div className="flex flex-col">
                                <span>{column.name}</span>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {column.data_type}
                                  </Badge>
                                  {column.is_primary_key && (
                                    <Badge variant="default" className="text-xs">PK</Badge>
                                  )}
                                  {column.is_foreign_key && (
                                    <Badge variant="secondary" className="text-xs">FK</Badge>
                                  )}
                                </div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {table.columns.map((column: any) => (
                              <TableCell key={column.name} className="max-w-xs">
                                {formatCellValue(row[column.name], column)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                    💡 This is sample data generated for demonstration purposes. 
                    In a real application, this would show actual data from your database.
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
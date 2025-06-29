import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Eye, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface SampleDataViewerProps {
  schema: {
    tables: any[];
    relationships: any[];
  };
  connectionId: string;
  originalSchema?: {
    tables: any[];
    relationships: any[];
  };
}

export const SampleDataViewer: React.FC<SampleDataViewerProps> = ({ 
  schema, 
  connectionId,
  originalSchema 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Determine if a table is from the original schema or AI-generated
  const isOriginalTable = (tableName: string) => {
    if (!originalSchema) return true; // If no original schema provided, treat all as original
    return originalSchema.tables.some(table => table.name === tableName);
  };

  // Generate realistic sample data based on table schema (only for original tables)
  const generateSampleData = (table: any) => {
    // Don't generate mock data for AI-generated tables
    if (!isOriginalTable(table.name)) {
      return [];
    }

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
          } else if (table.name === 'authors') {
            row[column.name] = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eva Brown'][i - 1];
          } else if (table.name === 'posts') {
            row[column.name] = ['Getting Started with React', 'Advanced TypeScript Tips', 'Database Design Patterns', 'API Best Practices', 'Modern CSS Techniques'][i - 1];
          } else if (table.name === 'companies') {
            row[column.name] = ['TechCorp Inc', 'Innovation Labs', 'Digital Solutions', 'Future Systems', 'Smart Ventures'][i - 1];
          } else if (table.name === 'contacts') {
            if (columnName.includes('first')) {
              row[column.name] = ['John', 'Jane', 'Mike', 'Sarah', 'David'][i - 1];
            } else if (columnName.includes('last')) {
              row[column.name] = ['Doe', 'Smith', 'Johnson', 'Wilson', 'Brown'][i - 1];
            } else {
              row[column.name] = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'][i - 1];
            }
          } else if (table.name === 'deals') {
            row[column.name] = ['Enterprise Software Deal', 'Marketing Campaign', 'Website Redesign', 'Mobile App Development', 'Cloud Migration'][i - 1];
          } else if (table.name === 'order_items') {
            row[column.name] = `Item ${i}`;
          } else {
            row[column.name] = `Sample ${column.name} ${i}`;
          }
        } else if (columnName.includes('title')) {
          if (table.name === 'posts') {
            row[column.name] = ['Getting Started with React', 'Advanced TypeScript Tips', 'Database Design Patterns', 'API Best Practices', 'Modern CSS Techniques'][i - 1];
          } else if (table.name === 'deals') {
            row[column.name] = ['Enterprise Software Deal', 'Marketing Campaign', 'Website Redesign', 'Mobile App Development', 'Cloud Migration'][i - 1];
          } else {
            row[column.name] = `Sample Title ${i}`;
          }
        } else if (columnName.includes('content')) {
          if (table.name === 'posts') {
            row[column.name] = [
              'Learn the fundamentals of React development with practical examples...',
              'Explore advanced TypeScript features that will improve your code quality...',
              'Best practices for designing scalable database schemas...',
              'Essential guidelines for building robust and maintainable APIs...',
              'Modern CSS techniques for responsive and beautiful web design...'
            ][i - 1];
          } else if (table.name === 'comments') {
            row[column.name] = [
              'Great article! Very helpful for beginners.',
              'Thanks for sharing these insights.',
              'I learned something new today.',
              'Could you elaborate on this point?',
              'Excellent explanation of the concepts.'
            ][i - 1];
          } else {
            row[column.name] = `Sample content for ${table.name} ${i}`;
          }
        } else if (columnName.includes('price') || columnName.includes('amount') || columnName.includes('value')) {
          row[column.name] = (Math.random() * 100 + 10).toFixed(2);
        } else if (columnName.includes('quantity')) {
          row[column.name] = Math.floor(Math.random() * 10) + 1;
        } else if (columnName.includes('status')) {
          if (table.name === 'orders') {
            row[column.name] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i - 1];
          } else {
            row[column.name] = ['active', 'inactive', 'pending', 'active', 'active'][i - 1];
          }
        } else if (columnName.includes('stage')) {
          row[column.name] = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed'][i - 1];
        } else if (columnName.includes('industry')) {
          row[column.name] = ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'][i - 1];
        } else if (columnName.includes('website')) {
          row[column.name] = [`https://www.company${i}.com`, `https://www.business${i}.org`, `https://www.enterprise${i}.net`, `https://www.startup${i}.io`, `https://www.firm${i}.com`][i - 1];
        } else if (columnName.includes('username')) {
          row[column.name] = [`alice_j`, `bob_smith`, `carol_d`, `david_w`, `eva_brown`][i - 1];
        } else if (columnName.includes('bio')) {
          row[column.name] = [
            'Passionate writer and technology enthusiast with 10+ years of experience.',
            'Full-stack developer who loves sharing knowledge through blogging.',
            'UX designer turned writer, focusing on design and usability topics.',
            'Data scientist exploring the intersection of AI and everyday life.',
            'Startup founder documenting the entrepreneurial journey.'
          ][i - 1];
        } else if (columnName.includes('created_at') || columnName.includes('updated_at') || columnName.includes('published_at') || dataType.includes('timestamp') || dataType.includes('datetime')) {
          const date = new Date();
          date.setDate(date.getDate() - (5 - i));
          row[column.name] = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        } else if (columnName.includes('user_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('author_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('post_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('product_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('category_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 3) + 1;
        } else if (columnName.includes('order_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('company_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (columnName.includes('contact_id') && column.is_foreign_key) {
          row[column.name] = Math.floor(Math.random() * 5) + 1;
        } else if (dataType.includes('boolean') || dataType.includes('bool')) {
          row[column.name] = Math.random() > 0.5;
        } else if (dataType.includes('int') || dataType.includes('number') || dataType.includes('serial')) {
          row[column.name] = Math.floor(Math.random() * 100) + 1;
        } else if (columnName.includes('description') || columnName.includes('notes')) {
          if (table.name === 'products') {
            row[column.name] = [
              'High-quality wireless headphones with noise cancellation',
              'Durable smartphone case with drop protection',
              'Adjustable laptop stand for better ergonomics',
              'Fast charging USB-C cable, 6ft length',
              'Portable bluetooth speaker with rich bass'
            ][i - 1];
          } else if (table.name === 'categories') {
            row[column.name] = [
              'Electronic devices and gadgets',
              'Phone and tablet accessories',
              'Computer hardware and peripherals',
              'Audio equipment and speakers',
              'Mobile device accessories'
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
        } else if (dataType.includes('varchar') || dataType.includes('text') || dataType.includes('string') || dataType.includes('nvarchar') || dataType.includes('longtext')) {
          row[column.name] = `Sample ${column.name} ${i}`;
        } else if (dataType.includes('money')) {
          row[column.name] = `$${(Math.random() * 10000 + 1000).toFixed(2)}`;
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
    
    if (column.name.toLowerCase().includes('price') || column.name.toLowerCase().includes('amount') || column.name.toLowerCase().includes('value')) {
      return <span className="font-mono text-green-600">${value}</span>;
    }
    
    if (column.name.toLowerCase().includes('status') || column.name.toLowerCase().includes('stage')) {
      const statusColors: any = {
        'active': 'bg-green-100 text-green-800',
        'inactive': 'bg-gray-100 text-gray-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'prospecting': 'bg-blue-100 text-blue-800',
        'qualification': 'bg-yellow-100 text-yellow-800',
        'proposal': 'bg-orange-100 text-orange-800',
        'negotiation': 'bg-purple-100 text-purple-800',
        'closed': 'bg-green-100 text-green-800'
      };
      return (
        <Badge variant="secondary" className={statusColors[value] || 'bg-gray-100 text-gray-800'}>
          {value.toUpperCase()}
        </Badge>
      );
    }
    
    if (column.data_type.toLowerCase().includes('timestamp') || column.data_type.toLowerCase().includes('datetime') || column.name.toLowerCase().includes('_at')) {
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

  // Dynamically create tabs for ALL available tables
  const availableTables = schema.tables || [];
  const maxTabsToShow = Math.min(availableTables.length, 6); // Show up to 6 tabs

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Sample Data ({availableTables.length} tables)
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
          {availableTables.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tables available</p>
              <p className="text-sm text-muted-foreground">
                Connect to a database to view sample data
              </p>
            </div>
          ) : (
            <Tabs defaultValue={availableTables[0]?.name} className="w-full">
              <TabsList className={`grid w-full mb-6 ${maxTabsToShow <= 3 ? 'grid-cols-3' : maxTabsToShow <= 4 ? 'grid-cols-4' : maxTabsToShow <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
                {availableTables.slice(0, maxTabsToShow).map((table) => (
                  <TabsTrigger key={table.name} value={table.name} className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {table.name}
                    {!isOriginalTable(table.name) && (
                      <Badge variant="secondary" className="text-xs ml-1">AI</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {availableTables.map((table) => {
                const sampleData = generateSampleData(table);
                const isAIGenerated = !isOriginalTable(table.name);
                
                return (
                  <TabsContent key={table.name} value={table.name} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {table.name}
                          {isAIGenerated && (
                            <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {table.columns.length} columns • {isAIGenerated ? 'No sample data' : `${sampleData.length} sample rows`}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {isAIGenerated ? 'AI Table' : 'Demo Data'}
                      </Badge>
                    </div>

                    {isAIGenerated ? (
                      <div className="border rounded-lg p-8 text-center bg-muted/20">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="text-lg font-semibold mb-2">AI-Generated Table</h4>
                        <p className="text-muted-foreground mb-4">
                          This table was created by AI transformation. No sample data is available.
                        </p>
                        <div className="text-left max-w-md mx-auto">
                          <h5 className="font-semibold mb-2">Table Structure:</h5>
                          <div className="space-y-1">
                            {table.columns.map((column: any) => (
                              <div key={column.name} className="flex items-center gap-2 text-sm">
                                <span className="font-mono">{column.name}</span>
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
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}

                    <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                      {isAIGenerated ? (
                        <>
                          🤖 This table was created by AI transformation. In a real database, this table would contain actual data populated by the SQL transformation.
                        </>
                      ) : (
                        <>
                          💡 This is sample data generated for demonstration purposes. 
                          In a real application, this would show actual data from your database.
                        </>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
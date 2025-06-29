import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ShoppingCart, FileText, Users } from 'lucide-react';
import { mockConnections, mockSchemas } from '@/lib/mockData';

interface SchemaSelectorProps {
  onSchemaSelect: (connectionId: string, schemaData: any) => void;
}

export const SchemaSelector: React.FC<SchemaSelectorProps> = ({ onSchemaSelect }) => {
  const schemaOptions = [
    {
      id: "conn_1",
      icon: ShoppingCart,
      title: "E-commerce Database",
      description: "Complete online store with products, orders, and users",
      database_type: "PostgreSQL",
      tables: mockSchemas.ecommerce.tables.length,
      relationships: mockSchemas.ecommerce.relationships.length,
      color: "bg-blue-500"
    },
    {
      id: "conn_2", 
      icon: FileText,
      title: "Blog CMS Database",
      description: "Content management system with posts, authors, and comments",
      database_type: "MySQL",
      tables: mockSchemas.blog.tables.length,
      relationships: mockSchemas.blog.relationships.length,
      color: "bg-green-500"
    },
    {
      id: "conn_3",
      icon: Users,
      title: "CRM Database", 
      description: "Customer relationship management with companies and deals",
      database_type: "SQL Server",
      tables: mockSchemas.crm.tables.length,
      relationships: mockSchemas.crm.relationships.length,
      color: "bg-purple-500"
    }
  ];

  const handleSelect = (optionId: string) => {
    const connection = mockConnections.find(conn => conn.id === optionId);
    const schemaKey = optionId === "conn_1" ? "ecommerce" : optionId === "conn_2" ? "blog" : "crm";
    const schema = mockSchemas[schemaKey as keyof typeof mockSchemas];
    
    if (connection && schema) {
      onSchemaSelect(optionId, { connection, schema });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Demo Database</h2>
        <p className="text-gray-600">Select a sample database schema to explore the AI transformation features</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {schemaOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card key={option.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Database Type:</span>
                  <Badge variant="outline">{option.database_type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tables:</span>
                  <span className="font-medium">{option.tables}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Relationships:</span>
                  <span className="font-medium">{option.relationships}</span>
                </div>
                <Button 
                  onClick={() => handleSelect(option.id)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Explore Schema
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
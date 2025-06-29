import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play } from 'lucide-react';

interface SchemaSelectorProps {
  onSchemaSelect: (connectionId: string, mockData: any) => void;
}

const mockSchemas = [
  {
    id: 'ecommerce_pg',
    name: 'E-commerce Platform',
    type: 'postgresql',
    description: 'Complete online store with products, orders, and user management',
    tables: 8,
    connection: {
      id: 'ecommerce_pg',
      name: 'E-commerce Platform',
      database_type: 'postgresql',
      database: 'ecommerce_db'
    },
    schema: {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'email', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'full_name', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'created_at', data_type: 'timestamp', is_primary_key: false, is_nullable: false, is_foreign_key: false }
          ]
        },
        {
          name: 'products',
          columns: [
            { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'name', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'price', data_type: 'decimal', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'category_id', data_type: 'integer', is_primary_key: false, is_nullable: true, is_foreign_key: true }
          ]
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', data_type: 'integer', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'user_id', data_type: 'integer', is_primary_key: false, is_nullable: false, is_foreign_key: true },
            { name: 'total_amount', data_type: 'decimal', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'status', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false }
          ]
        }
      ],
      relationships: [
        { from_table: 'orders', to_table: 'users', relationship_type: 'many-to-one', constraint_name: 'fk_orders_user' },
        { from_table: 'products', to_table: 'categories', relationship_type: 'many-to-one', constraint_name: 'fk_products_category' }
      ]
    }
  },
  {
    id: 'blog_mysql',
    name: 'Blog Platform',
    type: 'mysql',
    description: 'Content management system with posts, comments, and authors',
    tables: 5,
    connection: {
      id: 'blog_mysql',
      name: 'Blog Platform',
      database_type: 'mysql',
      database: 'blog_cms'
    },
    schema: {
      tables: [
        {
          name: 'authors',
          columns: [
            { name: 'id', data_type: 'int', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'username', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'email', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'bio', data_type: 'text', is_primary_key: false, is_nullable: true, is_foreign_key: false }
          ]
        },
        {
          name: 'posts',
          columns: [
            { name: 'id', data_type: 'int', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'title', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'content', data_type: 'longtext', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'author_id', data_type: 'int', is_primary_key: false, is_nullable: false, is_foreign_key: true },
            { name: 'published_at', data_type: 'datetime', is_primary_key: false, is_nullable: true, is_foreign_key: false }
          ]
        },
        {
          name: 'comments',
          columns: [
            { name: 'id', data_type: 'int', is_primary_key: true, is_nullable: false, is_foreign_key: false },
            { name: 'post_id', data_type: 'int', is_primary_key: false, is_nullable: false, is_foreign_key: true },
            { name: 'author_name', data_type: 'varchar', is_primary_key: false, is_nullable: false, is_foreign_key: false },
            { name: 'content', data_type: 'text', is_primary_key: false, is_nullable: false, is_foreign_key: false }
          ]
        }
      ],
      relationships: [
        { from_table: 'posts', to_table: 'authors', relationship_type: 'many-to-one', constraint_name: 'fk_posts_author' },
        { from_table: 'comments', to_table: 'posts', relationship_type: 'many-to-one', constraint_name: 'fk_comments_post' }
      ]
    }
  }
];

export const SchemaSelector: React.FC<SchemaSelectorProps> = ({ onSchemaSelect }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Choose a Demo Database</h2>
        <p className="text-muted-foreground">
          Select a sample database schema to explore AI transformations
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {mockSchemas.map((schema) => (
          <Card key={schema.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{schema.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {schema.type.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>{schema.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {schema.tables} tables
                </div>
                <Button 
                  onClick={() => onSchemaSelect(schema.id, schema)}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Explore Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
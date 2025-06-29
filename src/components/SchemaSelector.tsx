import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play } from 'lucide-react';

interface SchemaSelectorProps {
  onSchemaSelect: (connectionId: string, mockData: any) => void;
}

export const SchemaSelector: React.FC<SchemaSelectorProps> = ({ onSchemaSelect }) => {
  const mockDatabases = [
    {
      id: 'ecommerce_pg',
      name: 'E-commerce Platform',
      type: 'PostgreSQL',
      description: 'Complete e-commerce database with users, products, orders, and categories',
      tables: 4,
      relationships: 3,
      schema: {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'email', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'full_name', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'created_at', data_type: 'timestamp', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'products',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'name', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'price', data_type: 'decimal', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'category_id', data_type: 'integer', is_nullable: true, is_primary_key: false, is_foreign_key: true }
            ]
          },
          {
            name: 'orders',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'user_id', data_type: 'integer', is_nullable: false, is_primary_key: false, is_foreign_key: true },
              { name: 'total_amount', data_type: 'decimal', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'status', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'categories',
            columns: [
              { name: 'id', data_type: 'integer', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'name', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'description', data_type: 'text', is_nullable: true, is_primary_key: false, is_foreign_key: false }
            ]
          }
        ],
        relationships: [
          { from_table: 'orders', to_table: 'users', constraint_name: 'fk_orders_user', relationship_type: 'many-to-one' },
          { from_table: 'products', to_table: 'categories', constraint_name: 'fk_products_category', relationship_type: 'many-to-one' }
        ]
      }
    },
    {
      id: 'blog_mysql',
      name: 'Blog Platform',
      type: 'MySQL',
      description: 'Blog management system with posts, authors, comments, and tags',
      tables: 5,
      relationships: 4,
      schema: {
        tables: [
          {
            name: 'authors',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'username', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'email', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'bio', data_type: 'text', is_nullable: true, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'posts',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'title', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'content', data_type: 'longtext', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'author_id', data_type: 'int', is_nullable: false, is_primary_key: false, is_foreign_key: true },
              { name: 'published_at', data_type: 'datetime', is_nullable: true, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'comments',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'post_id', data_type: 'int', is_nullable: false, is_primary_key: false, is_foreign_key: true },
              { name: 'author_name', data_type: 'varchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'content', data_type: 'text', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'created_at', data_type: 'datetime', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          }
        ],
        relationships: [
          { from_table: 'posts', to_table: 'authors', constraint_name: 'fk_posts_author', relationship_type: 'many-to-one' },
          { from_table: 'comments', to_table: 'posts', constraint_name: 'fk_comments_post', relationship_type: 'many-to-one' }
        ]
      }
    },
    {
      id: 'crm_sqlserver',
      name: 'CRM System',
      type: 'SQL Server',
      description: 'Customer relationship management with contacts, companies, and deals',
      tables: 4,
      relationships: 3,
      schema: {
        tables: [
          {
            name: 'companies',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'name', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'industry', data_type: 'nvarchar', is_nullable: true, is_primary_key: false, is_foreign_key: false },
              { name: 'website', data_type: 'nvarchar', is_nullable: true, is_primary_key: false, is_foreign_key: false }
            ]
          },
          {
            name: 'contacts',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'first_name', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'last_name', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'email', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'company_id', data_type: 'int', is_nullable: true, is_primary_key: false, is_foreign_key: true }
            ]
          },
          {
            name: 'deals',
            columns: [
              { name: 'id', data_type: 'int', is_nullable: false, is_primary_key: true, is_foreign_key: false },
              { name: 'title', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'value', data_type: 'money', is_nullable: false, is_primary_key: false, is_foreign_key: false },
              { name: 'contact_id', data_type: 'int', is_nullable: false, is_primary_key: false, is_foreign_key: true },
              { name: 'stage', data_type: 'nvarchar', is_nullable: false, is_primary_key: false, is_foreign_key: false }
            ]
          }
        ],
        relationships: [
          { from_table: 'contacts', to_table: 'companies', constraint_name: 'fk_contacts_company', relationship_type: 'many-to-one' },
          { from_table: 'deals', to_table: 'contacts', constraint_name: 'fk_deals_contact', relationship_type: 'many-to-one' }
        ]
      }
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockDatabases.map((db) => (
        <Card key={db.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Database className="h-8 w-8 text-primary" />
              <Badge variant="outline">{db.type}</Badge>
            </div>
            <CardTitle className="text-lg">{db.name}</CardTitle>
            <CardDescription className="text-sm">
              {db.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tables:</span>
                <span className="font-medium">{db.tables}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Relationships:</span>
                <span className="font-medium">{db.relationships}</span>
              </div>
              
              <Button 
                className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground"
                variant="outline"
                onClick={() => onSchemaSelect(db.id, { connection: { id: db.id, name: db.name, database_type: db.type.toLowerCase() }, schema: db.schema })}
              >
                <Play className="h-4 w-4 mr-2" />
                Explore Schema
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
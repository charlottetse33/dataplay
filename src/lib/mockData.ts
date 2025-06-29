export const mockSchemas = {
  ecommerce: {
    name: "E-commerce Database",
    database_type: "postgresql",
    tables: [
      {
        name: "users",
        columns: [
          { name: "id", data_type: "integer", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "email", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "first_name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "last_name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "created_at", data_type: "timestamp", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "updated_at", data_type: "timestamp", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 }
        ]
      },
      {
        name: "products",
        columns: [
          { name: "id", data_type: "integer", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "description", data_type: "text", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "price", data_type: "decimal", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "category_id", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 5 },
          { name: "stock_quantity", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 },
          { name: "created_at", data_type: "timestamp", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 7 }
        ]
      },
      {
        name: "categories",
        columns: [
          { name: "id", data_type: "integer", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "parent_id", data_type: "integer", is_nullable: true, is_primary_key: false, is_foreign_key: true, ordinal_position: 3 }
        ]
      },
      {
        name: "orders",
        columns: [
          { name: "id", data_type: "integer", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "user_id", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 2 },
          { name: "total_amount", data_type: "decimal", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "status", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "created_at", data_type: "timestamp", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 }
        ]
      },
      {
        name: "order_items",
        columns: [
          { name: "id", data_type: "integer", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "order_id", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 2 },
          { name: "product_id", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 3 },
          { name: "quantity", data_type: "integer", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "price", data_type: "decimal", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 }
        ]
      }
    ],
    relationships: [
      { from_table: "products", to_table: "categories", from_column: "category_id", to_column: "id", constraint_name: "fk_products_category", relationship_type: "many-to-one" },
      { from_table: "categories", to_table: "categories", from_column: "parent_id", to_column: "id", constraint_name: "fk_categories_parent", relationship_type: "many-to-one" },
      { from_table: "orders", to_table: "users", from_column: "user_id", to_column: "id", constraint_name: "fk_orders_user", relationship_type: "many-to-one" },
      { from_table: "order_items", to_table: "orders", from_column: "order_id", to_column: "id", constraint_name: "fk_order_items_order", relationship_type: "many-to-one" },
      { from_table: "order_items", to_table: "products", from_column: "product_id", to_column: "id", constraint_name: "fk_order_items_product", relationship_type: "many-to-one" }
    ]
  },
  
  blog: {
    name: "Blog CMS Database",
    database_type: "mysql",
    tables: [
      {
        name: "authors",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "username", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "email", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "full_name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "bio", data_type: "text", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "avatar_url", data_type: "varchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 }
        ]
      },
      {
        name: "posts",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "title", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "slug", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "content", data_type: "longtext", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "excerpt", data_type: "text", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "author_id", data_type: "int", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 6 },
          { name: "status", data_type: "enum", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 7 },
          { name: "published_at", data_type: "datetime", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 8 },
          { name: "created_at", data_type: "timestamp", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 9 }
        ]
      },
      {
        name: "tags",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "slug", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 }
        ]
      },
      {
        name: "post_tags",
        columns: [
          { name: "post_id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: true, ordinal_position: 1 },
          { name: "tag_id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: true, ordinal_position: 2 }
        ]
      },
      {
        name: "comments",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "post_id", data_type: "int", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 2 },
          { name: "author_name", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "author_email", data_type: "varchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "content", data_type: "text", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "status", data_type: "enum", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 },
          { name: "created_at", data_type: "timestamp", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 7 }
        ]
      }
    ],
    relationships: [
      { from_table: "posts", to_table: "authors", from_column: "author_id", to_column: "id", constraint_name: "fk_posts_author", relationship_type: "many-to-one" },
      { from_table: "post_tags", to_table: "posts", from_column: "post_id", to_column: "id", constraint_name: "fk_post_tags_post", relationship_type: "many-to-one" },
      { from_table: "post_tags", to_table: "tags", from_column: "tag_id", to_column: "id", constraint_name: "fk_post_tags_tag", relationship_type: "many-to-one" },
      { from_table: "comments", to_table: "posts", from_column: "post_id", to_column: "id", constraint_name: "fk_comments_post", relationship_type: "many-to-one" }
    ]
  },

  crm: {
    name: "CRM Database",
    database_type: "mssql",
    tables: [
      {
        name: "companies",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "name", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 2 },
          { name: "industry", data_type: "nvarchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "size", data_type: "nvarchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "website", data_type: "nvarchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "created_at", data_type: "datetime2", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 }
        ]
      },
      {
        name: "contacts",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "company_id", data_type: "int", is_nullable: true, is_primary_key: false, is_foreign_key: true, ordinal_position: 2 },
          { name: "first_name", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 3 },
          { name: "last_name", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "email", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "phone", data_type: "nvarchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 },
          { name: "position", data_type: "nvarchar", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 7 }
        ]
      },
      {
        name: "deals",
        columns: [
          { name: "id", data_type: "int", is_nullable: false, is_primary_key: true, is_foreign_key: false, ordinal_position: 1 },
          { name: "company_id", data_type: "int", is_nullable: false, is_primary_key: false, is_foreign_key: true, ordinal_position: 2 },
          { name: "contact_id", data_type: "int", is_nullable: true, is_primary_key: false, is_foreign_key: true, ordinal_position: 3 },
          { name: "title", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 4 },
          { name: "value", data_type: "money", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 5 },
          { name: "stage", data_type: "nvarchar", is_nullable: false, is_primary_key: false, is_foreign_key: false, ordinal_position: 6 },
          { name: "probability", data_type: "decimal", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 7 },
          { name: "expected_close_date", data_type: "date", is_nullable: true, is_primary_key: false, is_foreign_key: false, ordinal_position: 8 }
        ]
      }
    ],
    relationships: [
      { from_table: "contacts", to_table: "companies", from_column: "company_id", to_column: "id", constraint_name: "fk_contacts_company", relationship_type: "many-to-one" },
      { from_table: "deals", to_table: "companies", from_column: "company_id", to_column: "id", constraint_name: "fk_deals_company", relationship_type: "many-to-one" },
      { from_table: "deals", to_table: "contacts", from_column: "contact_id", to_column: "id", constraint_name: "fk_deals_contact", relationship_type: "many-to-one" }
    ]
  }
};

export const mockConnections = [
  {
    id: "conn_1",
    name: "E-commerce Production",
    database_type: "postgresql",
    host: "prod-db.example.com",
    port: 5432,
    database: "ecommerce_prod",
    username: "app_user",
    is_active: true,
    last_connected: new Date().toISOString()
  },
  {
    id: "conn_2", 
    name: "Blog CMS",
    database_type: "mysql",
    host: "blog-db.example.com",
    port: 3306,
    database: "blog_cms",
    username: "cms_user",
    is_active: false,
    last_connected: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "conn_3",
    name: "CRM System",
    database_type: "mssql", 
    host: "crm-db.example.com",
    port: 1433,
    database: "crm_prod",
    username: "crm_user",
    is_active: false,
    last_connected: new Date(Date.now() - 172800000).toISOString()
  }
];

export const getSchemaForConnection = (connectionId: string) => {
  switch (connectionId) {
    case "conn_1":
      return mockSchemas.ecommerce;
    case "conn_2":
      return mockSchemas.blog;
    case "conn_3":
      return mockSchemas.crm;
    default:
      return mockSchemas.ecommerce;
  }
};
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Edit, Database, Zap } from 'lucide-react';

interface TransformationShortcutsProps {
  onShortcutSelect: (prompt: string) => void;
  currentSchema?: any;
}

export const TransformationShortcuts: React.FC<TransformationShortcutsProps> = ({
  onShortcutSelect,
  currentSchema
}) => {
  // Generate contextual shortcuts based on current schema
  const generateContextualShortcuts = () => {
    if (!currentSchema?.tables) {
      return getGenericShortcuts();
    }

    const tables = currentSchema.tables;
    const shortcuts = [];

    // Add Column shortcuts based on existing tables
    const addColumnShortcuts = {
      category: "Add Columns",
      icon: <Plus className="h-4 w-4" />,
      color: "bg-green-100 text-green-800",
      examples: []
    };

    tables.forEach((table: any) => {
      const tableName = table.name;
      
      // Suggest common columns that might be missing
      const hasCreatedAt = table.columns.some((col: any) => 
        col.name.toLowerCase().includes('created') || col.name.toLowerCase().includes('timestamp')
      );
      const hasUpdatedAt = table.columns.some((col: any) => 
        col.name.toLowerCase().includes('updated')
      );
      const hasDeletedAt = table.columns.some((col: any) => 
        col.name.toLowerCase().includes('deleted')
      );
      const hasStatus = table.columns.some((col: any) => 
        col.name.toLowerCase().includes('status')
      );

      if (!hasCreatedAt) {
        addColumnShortcuts.examples.push(`Add a created_at timestamp column to the ${tableName} table`);
      }
      if (!hasUpdatedAt) {
        addColumnShortcuts.examples.push(`Add an updated_at timestamp column to the ${tableName} table`);
      }
      if (!hasDeletedAt && tableName !== 'audit_log') {
        addColumnShortcuts.examples.push(`Add a deleted_at timestamp column to the ${tableName} table for soft deletes`);
      }
      if (!hasStatus && tableName !== 'categories') {
        addColumnShortcuts.examples.push(`Add a status column to the ${tableName} table`);
      }

      // Table-specific suggestions
      if (tableName === 'users') {
        const hasPhone = table.columns.some((col: any) => col.name.toLowerCase().includes('phone'));
        const hasAvatar = table.columns.some((col: any) => col.name.toLowerCase().includes('avatar'));
        if (!hasPhone) {
          addColumnShortcuts.examples.push(`Add a phone_number column to the users table`);
        }
        if (!hasAvatar) {
          addColumnShortcuts.examples.push(`Add an avatar_url column to the users table`);
        }
      }

      if (tableName === 'products') {
        const hasDescription = table.columns.some((col: any) => col.name.toLowerCase().includes('description'));
        const hasSku = table.columns.some((col: any) => col.name.toLowerCase().includes('sku'));
        if (!hasDescription) {
          addColumnShortcuts.examples.push(`Add a description text column to the products table`);
        }
        if (!hasSku) {
          addColumnShortcuts.examples.push(`Add a sku varchar column to the products table`);
        }
      }

      if (tableName === 'orders') {
        const hasNotes = table.columns.some((col: any) => col.name.toLowerCase().includes('notes'));
        if (!hasNotes) {
          addColumnShortcuts.examples.push(`Add a notes text column to the orders table`);
        }
      }
    });

    if (addColumnShortcuts.examples.length > 0) {
      shortcuts.push(addColumnShortcuts);
    }

    // Remove Column shortcuts for existing columns
    const removeColumnShortcuts = {
      category: "Remove Columns",
      icon: <Minus className="h-4 w-4" />,
      color: "bg-red-100 text-red-800",
      examples: []
    };

    tables.forEach((table: any) => {
      const tableName = table.name;
      table.columns.forEach((col: any) => {
        if (!col.is_primary_key && !col.is_foreign_key) {
          removeColumnShortcuts.examples.push(`Remove the ${col.name} column from the ${tableName} table`);
        }
      });
    });

    if (removeColumnShortcuts.examples.length > 0) {
      shortcuts.push({
        ...removeColumnShortcuts,
        examples: removeColumnShortcuts.examples.slice(0, 4) // Limit to 4 examples
      });
    }

    // Modify Column shortcuts
    const modifyColumnShortcuts = {
      category: "Modify Columns",
      icon: <Edit className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800",
      examples: []
    };

    tables.forEach((table: any) => {
      const tableName = table.name;
      table.columns.forEach((col: any) => {
        if (!col.is_primary_key && !col.is_foreign_key) {
          if (col.data_type === 'varchar') {
            modifyColumnShortcuts.examples.push(`Change the ${col.name} column in ${tableName} table to text type`);
          }
          if (col.name.includes('_')) {
            const newName = col.name.replace('_', '');
            modifyColumnShortcuts.examples.push(`Rename the ${col.name} column to ${newName} in the ${tableName} table`);
          }
        }
      });
    });

    if (modifyColumnShortcuts.examples.length > 0) {
      shortcuts.push({
        ...modifyColumnShortcuts,
        examples: modifyColumnShortcuts.examples.slice(0, 3)
      });
    }

    // Create Table shortcuts based on common patterns
    const createTableShortcuts = {
      category: "Create Tables",
      icon: <Database className="h-4 w-4" />,
      color: "bg-purple-100 text-purple-800",
      examples: []
    };

    const existingTableNames = tables.map((t: any) => t.name.toLowerCase());
    
    if (!existingTableNames.includes('categories')) {
      createTableShortcuts.examples.push(`Create a categories table with id, name, and description columns`);
    }
    if (!existingTableNames.includes('order_items')) {
      createTableShortcuts.examples.push(`Create an order_items table to link orders and products with quantity`);
    }
    if (!existingTableNames.includes('user_profiles')) {
      createTableShortcuts.examples.push(`Create a user_profiles table with user_id, bio, and avatar_url columns`);
    }
    if (!existingTableNames.includes('audit_log')) {
      createTableShortcuts.examples.push(`Create an audit_log table for tracking database changes`);
    }
    if (!existingTableNames.includes('reviews')) {
      createTableShortcuts.examples.push(`Create a reviews table with user_id, product_id, rating, and comment columns`);
    }

    if (createTableShortcuts.examples.length > 0) {
      shortcuts.push(createTableShortcuts);
    }

    // Index shortcuts based on existing columns
    const indexShortcuts = {
      category: "Indexes & Performance",
      icon: <Zap className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800",
      examples: []
    };

    tables.forEach((table: any) => {
      const tableName = table.name;
      table.columns.forEach((col: any) => {
        if (col.name.toLowerCase().includes('email')) {
          indexShortcuts.examples.push(`Create an index on the ${col.name} column in the ${tableName} table`);
        }
        if (col.is_foreign_key) {
          indexShortcuts.examples.push(`Create an index on the ${col.name} foreign key in the ${tableName} table`);
        }
        if (col.name.toLowerCase().includes('created_at')) {
          indexShortcuts.examples.push(`Create an index on the ${col.name} column in the ${tableName} table for date queries`);
        }
      });
    });

    if (indexShortcuts.examples.length > 0) {
      shortcuts.push({
        ...indexShortcuts,
        examples: indexShortcuts.examples.slice(0, 3)
      });
    }

    return shortcuts.length > 0 ? shortcuts : getGenericShortcuts();
  };

  const getGenericShortcuts = () => {
    return [
      {
        category: "Add Columns",
        icon: <Plus className="h-4 w-4" />,
        color: "bg-green-100 text-green-800",
        examples: [
          "Add a phone_number column to the users table",
          "Add a description column to the products table",
          "Add a created_at timestamp column to the orders table",
          "Add an is_active boolean column to the users table"
        ]
      },
      {
        category: "Create Tables",
        icon: <Database className="h-4 w-4" />,
        color: "bg-purple-100 text-purple-800",
        examples: [
          "Create a categories table with id, name, and description columns",
          "Create an order_items table to link orders and products",
          "Create a user_profiles table with user_id, bio, and avatar_url",
          "Create an audit_log table for tracking changes"
        ]
      },
      {
        category: "Indexes & Performance",
        icon: <Zap className="h-4 w-4" />,
        color: "bg-yellow-100 text-yellow-800",
        examples: [
          "Create an index on the email column in the users table",
          "Add an index on the category_id column in the products table",
          "Create a composite index on user_id and created_at in the orders table"
        ]
      }
    ];
  };

  const shortcuts = generateContextualShortcuts();

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Transformation Examples</h3>
        <p className="text-sm text-gray-600">
          Click any example to try it out, or write your own transformation in plain English
        </p>
      </div>
      
      <div className="grid gap-4">
        {shortcuts.map((shortcut, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant="secondary" className={shortcut.color}>
                  {shortcut.icon}
                  {shortcut.category}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                {shortcut.category === "Add Columns" && "Add new columns to existing tables"}
                {shortcut.category === "Remove Columns" && "Remove existing columns from tables"}
                {shortcut.category === "Modify Columns" && "Rename or change column properties"}
                {shortcut.category === "Create Tables" && "Create new tables with columns"}
                {shortcut.category === "Indexes & Performance" && "Add indexes to improve query performance"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-2">
                {shortcut.examples.slice(0, 3).map((example, exampleIndex) => (
                  <Button
                    key={exampleIndex}
                    variant="ghost"
                    className="justify-start h-auto p-3 text-left text-sm hover:bg-gray-50"
                    onClick={() => onShortcutSelect(example)}
                  >
                    <span className="text-gray-700">{example}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Or describe your own transformation:</p>
            <p className="text-sm text-gray-500">
              "Add a last_login timestamp to users" • "Create a reviews table" • "Remove unused columns"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
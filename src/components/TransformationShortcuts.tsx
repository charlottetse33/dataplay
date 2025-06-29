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
  const shortcuts = [
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
      category: "Remove Columns", 
      icon: <Minus className="h-4 w-4" />,
      color: "bg-red-100 text-red-800",
      examples: [
        "Remove the phone_number column from the users table",
        "Drop the description column from the products table",
        "Remove the old_status column from the orders table"
      ]
    },
    {
      category: "Modify Columns",
      icon: <Edit className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800", 
      examples: [
        "Rename the full_name column to display_name in the users table",
        "Change the price column type to decimal(10,2) in the products table",
        "Rename the status column to order_status in the orders table"
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

  // Filter out examples that reference non-existent tables/columns
  const getValidExamples = (examples: string[]) => {
    if (!currentSchema?.tables) return examples;
    
    return examples.filter(example => {
      const lowerExample = example.toLowerCase();
      
      // Check if referenced tables exist
      const tableNames = currentSchema.tables.map((t: any) => t.name.toLowerCase());
      const referencedTables = tableNames.filter(tableName => 
        lowerExample.includes(`${tableName} table`) || 
        lowerExample.includes(`from ${tableName}`) ||
        lowerExample.includes(`in ${tableName}`)
      );
      
      // For removal operations, check if columns exist
      if (lowerExample.includes('remove') || lowerExample.includes('drop')) {
        for (const tableName of referencedTables) {
          const table = currentSchema.tables.find((t: any) => t.name.toLowerCase() === tableName);
          if (table) {
            const columnMatch = lowerExample.match(/(?:remove|drop).*?(\w+)\s+column/);
            if (columnMatch) {
              const columnName = columnMatch[1];
              const columnExists = table.columns.some((c: any) => 
                c.name.toLowerCase() === columnName.toLowerCase()
              );
              if (!columnExists) return false;
            }
          }
        }
      }
      
      return referencedTables.length > 0 || !lowerExample.includes(' table');
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Transformation Examples</h3>
        <p className="text-sm text-gray-600">Click any example to try it out, or write your own transformation in plain English</p>
      </div>
      
      <div className="grid gap-4">
        {shortcuts.map((shortcut, index) => {
          const validExamples = getValidExamples(shortcut.examples);
          
          if (validExamples.length === 0) return null;
          
          return (
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
                  {validExamples.slice(0, 3).map((example, exampleIndex) => (
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
          );
        })}
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
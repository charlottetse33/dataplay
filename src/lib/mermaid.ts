export const generateERDiagram = (tables: any[], relationships: any[]): string => {
  let diagram = 'erDiagram\n';
  
  // Add tables with their columns
  tables.forEach(table => {
    diagram += `    ${table.name} {\n`;
    
    table.columns.forEach((column: any) => {
      let columnDef = `        ${column.data_type} ${column.name}`;
      
      if (column.is_primary_key) {
        columnDef += ' PK';
      }
      if (column.is_foreign_key) {
        columnDef += ' FK';
      }
      if (!column.is_nullable) {
        columnDef += ' "NOT NULL"';
      }
      
      diagram += columnDef + '\n';
    });
    
    diagram += '    }\n\n';
  });
  
  // Add relationships
  relationships.forEach(rel => {
    const relationshipType = rel.relationship_type === 'many-to-one' ? '||--o{' : 
                           rel.relationship_type === 'one-to-many' ? '}o--||' :
                           rel.relationship_type === 'one-to-one' ? '||--||' :
                           rel.relationship_type === 'many-to-many' ? '}o--o{' :
                           '||--o{'; // default to many-to-one
    
    diagram += `    ${rel.to_table} ${relationshipType} ${rel.from_table} : "${rel.constraint_name}"\n`;
  });
  
  return diagram;
};
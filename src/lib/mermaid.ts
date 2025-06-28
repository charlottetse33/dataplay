import mermaid from 'mermaid';

export const initializeMermaid = () => {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
    er: {
      diagramPadding: 20,
      layoutDirection: 'TB',
      minEntityWidth: 100,
      minEntityHeight: 75,
      entityPadding: 15,
      stroke: '#0EA5E9',
      fill: '#F0F9FF',
      fontSize: 12,
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    }
  });
};

export const generateERDiagram = (tables: any[], relationships: any[]): string => {
  let diagram = 'erDiagram\n';
  
  // Add tables with their columns
  tables.forEach(table => {
    diagram += `    ${table.name} {\n`;
    table.columns.forEach((column: any) => {
      const type = column.data_type.toUpperCase();
      const nullable = column.is_nullable ? '' : ' PK';
      const key = column.is_primary_key ? ' PK' : column.is_foreign_key ? ' FK' : '';
      diagram += `        ${type} ${column.name}${key}\n`;
    });
    diagram += '    }\n\n';
  });
  
  // Add relationships
  relationships.forEach(rel => {
    const relationshipType = rel.relationship_type || 'one-to-many';
    let mermaidRel = '||--o{';
    
    switch (relationshipType) {
      case 'one-to-one':
        mermaidRel = '||--||';
        break;
      case 'one-to-many':
        mermaidRel = '||--o{';
        break;
      case 'many-to-many':
        mermaidRel = '}o--o{';
        break;
    }
    
    diagram += `    ${rel.from_table} ${mermaidRel} ${rel.to_table} : "${rel.constraint_name}"\n`;
  });
  
  return diagram;
};

export const renderDiagram = async (element: HTMLElement, diagram: string): Promise<void> => {
  try {
    element.innerHTML = '';
    const { svg } = await mermaid.render('diagram', diagram);
    element.innerHTML = svg;
  } catch (error) {
    console.error('Error rendering diagram:', error);
    element.innerHTML = '<p class="text-red-500">Error rendering diagram</p>';
  }
};

export { mermaid };
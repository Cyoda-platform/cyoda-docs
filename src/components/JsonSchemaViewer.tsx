import React, { useState } from 'react';

interface JsonSchemaViewerProps {
  schema: any;
  name?: string;
}

interface SchemaProperty {
  type?: string | string[];
  description?: string;
  properties?: Record<string, any>;
  items?: any;
  enum?: any[];
  $ref?: string;
  required?: string[];
  [key: string]: any;
}

/**
 * Extract schema name and URL from $ref
 * e.g., "../../condition/QueryCondition.json" -> { name: "QueryCondition", url: "/schemas/common/condition/query-condition/" }
 */
function resolveRef(ref: string): { name: string; url: string } | null {
  if (!ref) return null;

  // Extract the file name from the reference
  const match = ref.match(/([^/]+)\.json$/);
  if (!match) return null;

  const schemaName = match[1];

  // Convert PascalCase to kebab-case for URL
  const urlName = schemaName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();

  // Parse the relative path to determine the full URL
  let url = '';

  if (ref.includes('/condition/')) {
    url = `/schemas/common/condition/${urlName}/`;
  } else if (ref.includes('/statemachine/conf/')) {
    url = `/schemas/common/statemachine/conf/${urlName}/`;
  } else if (ref.includes('/statemachine/')) {
    url = `/schemas/common/statemachine/${urlName}/`;
  } else if (ref.includes('/entity/')) {
    url = `/schemas/entity/${urlName}/`;
  } else if (ref.includes('/model/')) {
    url = `/schemas/model/${urlName}/`;
  } else if (ref.includes('/search/')) {
    url = `/schemas/search/${urlName}/`;
  } else if (ref.includes('/processing/')) {
    url = `/schemas/processing/${urlName}/`;
  } else if (ref.includes('/common/')) {
    url = `/schemas/common/${urlName}/`;
  } else {
    // Default to common if we can't determine
    url = `/schemas/common/${urlName}/`;
  }

  return { name: schemaName, url };
}

/**
 * Custom JSON Schema Viewer Component
 * Displays JSON schemas in an interactive, expandable format
 */
export const JsonSchemaViewer: React.FC<JsonSchemaViewerProps> = ({
  schema,
  name = 'Schema',
}) => {
  return (
    <div className="json-schema-viewer-wrapper">
      <div className="schema-header">
        <h3>{name}</h3>
        {schema.description && (
          <p className="schema-description">{schema.description}</p>
        )}
      </div>
      <SchemaProperties schema={schema} level={0} />
    </div>
  );
};

const SchemaProperties: React.FC<{ schema: SchemaProperty; level: number }> = ({
  schema,
  level,
}) => {
  const [expanded, setExpanded] = useState(level < 2);

  if (!schema) return null;

  const { type, description, properties, items, enum: enumValues, required = [] } = schema;

  const renderType = (t: string | string[] | undefined): string => {
    if (Array.isArray(t)) return t.join(' | ');
    return t || 'any';
  };

  const renderProperty = (propName: string, propSchema: SchemaProperty, isRequired: boolean) => {
    const [propExpanded, setPropExpanded] = useState(false);
    const hasNested = propSchema.properties || propSchema.items;

    // Check if this property has a $ref
    const refInfo = propSchema.$ref ? resolveRef(propSchema.$ref) : null;

    return (
      <div key={propName} className="schema-property" style={{ marginLeft: `${level * 20}px` }}>
        <div className="property-header">
          {hasNested && (
            <button
              className="expand-button"
              onClick={() => setPropExpanded(!propExpanded)}
              aria-label={propExpanded ? 'Collapse' : 'Expand'}
            >
              {propExpanded ? '▼' : '▶'}
            </button>
          )}
          <span className="property-name">{propName}</span>
          {refInfo ? (
            <a href={refInfo.url} className="property-type property-ref-link">
              {refInfo.name}
            </a>
          ) : (
            <span className="property-type">{renderType(propSchema.type)}</span>
          )}
          {isRequired && <span className="required-badge">required</span>}
        </div>
        {propSchema.description && (
          <div className="property-description">{propSchema.description}</div>
        )}
        {propSchema.enum && (
          <div className="property-enum">
            <strong>Allowed values:</strong> {propSchema.enum.join(', ')}
          </div>
        )}
        {propExpanded && propSchema.properties && (
          <div className="nested-properties">
            {Object.entries(propSchema.properties).map(([nestedName, nestedSchema]) => (
              renderProperty(
                nestedName,
                nestedSchema as SchemaProperty,
                propSchema.required?.includes(nestedName) || false
              )
            ))}
          </div>
        )}
        {propExpanded && propSchema.items && (
          <div className="array-items">
            <div className="property-label">Array items:</div>
            <SchemaProperties schema={propSchema.items} level={level + 1} />
          </div>
        )}
      </div>
    );
  };

  if (!properties) {
    return (
      <div className="schema-simple">
        <div className="property-type-info">
          Type: <strong>{renderType(type)}</strong>
        </div>
        {description && <div className="property-description">{description}</div>}
        {enumValues && (
          <div className="property-enum">
            <strong>Allowed values:</strong> {enumValues.join(', ')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="schema-properties">
      {Object.entries(properties).map(([propName, propSchema]) =>
        renderProperty(propName, propSchema as SchemaProperty, required.includes(propName))
      )}
    </div>
  );
};

export default JsonSchemaViewer;


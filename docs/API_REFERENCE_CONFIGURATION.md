# API Reference Configuration Guide

This documentation site supports two different API documentation renderers that you can easily switch between:

## Available Options

### 1. Scalar (Default)
- **Modern, interactive API documentation**
- **Dark theme integration** matching the site design
- **Advanced search functionality** with keyboard shortcuts
- **Interactive request/response examples** with multiple programming languages
- **Authentication configuration panel** for Bearer tokens
- **Full OpenAPI 3.x support** with excellent rendering
- **Client code generation** examples in Shell, Ruby, Node.js, PHP, Python, and more

### 2. Stoplight Elements
- **Clean, professional interface** with sidebar navigation
- **Comprehensive schema documentation** with detailed model views
- **Export functionality** for OpenAPI specifications
- **Security configuration** with clear authentication guidance
- **Responsive design** that works well on all screen sizes
- **React-based components** with smooth interactions

## How to Switch Between Renderers

### Method 1: Configuration Variable (Recommended)

Edit the `API_RENDERER` variable in `/src/pages/api-reference.astro`:

```javascript
// Configuration: Choose your API documentation renderer
// Options: 'scalar' | 'stoplight'
const API_RENDERER = 'scalar';  // Change this to 'stoplight' to use Stoplight Elements
```

### Method 2: Direct URL Access

You can also access each renderer directly:

- **Scalar**: `http://localhost:4321/api-reference-scalar/`
- **Stoplight Elements**: `http://localhost:4321/api-reference-stoplight/`

## Implementation Details

### File Structure

```
src/pages/
├── api-reference.astro          # Main router that redirects based on configuration
├── api-reference-scalar.astro   # Scalar implementation
└── api-reference-stoplight.astro # Stoplight Elements implementation
```

### Features Comparison

| Feature | Scalar | Stoplight Elements |
|---------|--------|-------------------|
| Dark Theme | ✅ Built-in | ✅ Supported |
| Interactive Examples | ✅ Excellent | ✅ Good |
| Search Functionality | ✅ Advanced | ✅ Basic |
| Authentication UI | ✅ Interactive panel | ✅ Clear documentation |
| Code Generation | ✅ Multiple languages | ✅ Basic examples |
| Schema Visualization | ✅ Good | ✅ Excellent |
| Mobile Responsive | ✅ Yes | ✅ Yes |
| Loading Performance | ✅ Fast (CDN) | ✅ Fast (CDN) |

### Navigation Integration

Both implementations maintain consistent navigation:
- **Header navigation** with "Docs" and "API Ref" links
- **Seamless transitions** between documentation and API reference
- **Consistent styling** matching the site's design system

## Customization Options

### Scalar Customization

The Scalar configuration can be modified in `/src/pages/api-reference-scalar.astro`:

```javascript
data-configuration='{
  "spec": {
    "url": "/openapi/openapi.json"
  },
  "theme": "dark",
  "layout": "modern",
  "showSidebar": true
}'
```

### Stoplight Elements Customization

The Stoplight Elements configuration can be modified in `/src/pages/api-reference-stoplight.astro`:

```html
<elements-api
  apiDescriptionUrl="/openapi/openapi.json"
  router="hash"
  layout="sidebar"
  hideInternal="true"
  tryItCredentialsPolicy="include">
</elements-api>
```

## Recommendations

### Use Scalar When:
- You want a modern, interactive experience
- Dark theme integration is important
- Advanced search capabilities are needed
- Multiple programming language examples are valuable
- Interactive authentication testing is desired

### Use Stoplight Elements When:
- You prefer a more traditional documentation layout
- Detailed schema visualization is important
- You want React-based components
- Export functionality is needed
- You're already familiar with Stoplight's ecosystem

## Maintenance

Both implementations are maintained separately, allowing for:
- **Independent updates** without affecting the other
- **Custom styling** specific to each renderer
- **Feature-specific optimizations** for each platform
- **Easy A/B testing** between different approaches

The configuration system ensures that switching between renderers is as simple as changing a single variable, making it easy to experiment with different approaches or adapt to changing requirements.

# API Reference Configuration Guide

This documentation site supports two different API documentation renderers that you can easily switch between. The API reference is now embedded using an iframe for better isolation and configuration flexibility.

## Available Options

### 1. Scalar (Default)
- **Modern, interactive API documentation**
- **Dark theme integration** matching the site design
- **Advanced search functionality** with keyboard shortcuts
- **Interactive request/response examples** with multiple programming languages
- **Authentication configuration panel** for Bearer tokens
- **Full OpenAPI 3.x support** with excellent rendering
- **Client code generation** examples in Shell, Ruby, Node.js, PHP, Python, and more
- **Isolated rendering context** via iframe implementation

### 2. Stoplight Elements
- **Clean, professional interface** with sidebar navigation
- **Comprehensive schema documentation** with detailed model views
- **Export functionality** for OpenAPI specifications
- **Security configuration** with clear authentication guidance
- **Responsive design** that works well on all screen sizes
- **React-based components** with smooth interactions
- **Isolated rendering context** via iframe implementation

## How to Switch Between Renderers

### Method 1: Configuration Variable (Recommended)

Edit the `API_RENDERER` variable in `/src/pages/api-reference.astro`:

```javascript
// Configuration: Choose your API documentation renderer
// Options: 'scalar' | 'stoplight'
const API_RENDERER = 'scalar';  // Change this to 'stoplight' to use Stoplight Elements
```

### Method 2: Direct URL Access

You can access the main iframe page or individual renderers directly:

- **Main API Reference (iframe)**: `http://localhost:4321/api-reference/`
- **Scalar (direct)**: `http://localhost:4321/api-reference-scalar/`
- **Stoplight Elements (direct)**: `http://localhost:4321/api-reference-stoplight/`

## Implementation Details

### File Structure

```
src/pages/
├── api-reference.astro          # Main iframe container with header and navigation
├── api-reference-scalar.astro   # Scalar implementation (embedded via iframe)
└── api-reference-stoplight.astro # Stoplight Elements implementation (embedded via iframe)
```

### iframe Benefits

- **Isolated rendering context** - Complete separation from parent page CSS/JS
- **Independent configuration** - Scalar/Stoplight run in their own environment
- **Security isolation** - Prevents conflicts with main site scripts
- **Performance isolation** - API reference resources don't affect main page metrics
- **Easy configuration** - URL parameters can control renderer behavior

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

### iframe Configuration

The main iframe page (`/src/pages/api-reference.astro`) can be configured by modifying the `getIframeUrl` function:

```javascript
const getIframeUrl = (renderer: string) => {
  switch (renderer) {
    case 'stoplight':
      return '/api-reference-stoplight/';
    case 'scalar':
    default:
      return '/api-reference-scalar/?theme=light&layout=modern&showSidebar=true';
  }
};
```

### Scalar Customization

The Scalar implementation supports URL parameters for configuration:

- `theme` - `light` or `dark`
- `layout` - `modern` or `classic`
- `hideModels` - `true` or `false`
- `showSidebar` - `true` or `false`

Example iframe URL with custom configuration:
```
/api-reference-scalar/?theme=dark&layout=classic&hideModels=true&showSidebar=false
```

The Scalar page (`/src/pages/api-reference-scalar.astro`) reads these parameters and applies them:

```javascript
const url = new URL(Astro.request.url);
const theme = url.searchParams.get('theme') || 'light';
const layout = url.searchParams.get('layout') || 'modern';
const hideModels = url.searchParams.get('hideModels') === 'true';
const showSidebar = url.searchParams.get('showSidebar') !== 'false';
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

## iframe Implementation Notes

### Security Features
- **Sandbox attributes** - The iframe includes security restrictions
- **Same-origin policy** - Only accepts messages from same origin
- **Content isolation** - API reference cannot access parent page data

### Performance Features
- **Lazy loading** - iframe content loads only when needed
- **Loading states** - Visual feedback during iframe initialization
- **Error handling** - Graceful fallback if iframe fails to load
- **Timeout protection** - 10-second timeout with error message

### Mobile Responsiveness
- **Responsive design** - Header adapts to mobile screens
- **Touch-friendly** - All interactive elements work on mobile
- **Viewport optimization** - iframe adjusts height for mobile devices

## Maintenance

Both implementations are maintained separately, allowing for:
- **Independent updates** without affecting the other
- **Custom styling** specific to each renderer
- **Feature-specific optimizations** for each platform
- **Easy A/B testing** between different approaches

The configuration system ensures that switching between renderers is as simple as changing a single variable, making it easy to experiment with different approaches or adapt to changing requirements.

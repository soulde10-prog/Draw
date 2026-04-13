# Project Roadmap

## Phase 1: Enhanced 2D Foundation (Current Version: v1.0)
- Establish foundational 2D drawing capabilities
- Integrate basic shape tools (lines, rectangles, etc.)
- User interface design for 2D tools

## Phase 2: Roofing-Specific Tools (Version: v1.5)
- Develop tools specifically for roofing applications
- Include options for different roof types (tile, slate, corrugated, IBR, torch-on)
- Basic roofing components integration (valleys, skylights)

## Phase 3: 3D Visualization (Version: v2.0)
- Implement 3D modeling features
- Transition from 2D to 3D representations
- Ensure user adjustable dimensions and perspectives

## Phase 4: Advanced Features
- Add advanced features and tools based on user feedback
- Integrate additional roofing components (sidewall flashings, headwall flashings)

## Detailed File Structure
```
/
├── src/
│   ├── components/
│   ├── styles/
│   ├── utils/
│   └── main.js
├── public/
│   ├── index.html
├── package.json
└── README.md
```

## Zoho Creator Integration
- HTML Snippet Format:
```html
<div>
  <!-- Your HTML snippet here -->
</div>
```
- API Endpoint Examples:
```bash
GET /api/zoho-data
POST /api/zoho-create
```

## Dependencies (package.json)
```json
{
  "dependencies": {
    "express": "^4.17.1",
    "axios": "^0.21.1",
    "vue": "^3.0.0"
  }
}
```

## Roof Types
- Tile
- Slate
- Corrugated
- IBR
- Torch-on

## Roofing Components
- Valleys
- Skylights
- Sidewall Flashings
- Headwall Flashings
- Undertile Timber

## Kingpin Pitch Calculator
- **Advanced Area Calculations**
  - Pitch-Adjusted Area
  - Valley Calculations

---
*Last Updated:* 2026-04-13 08:15:24 (UTC)

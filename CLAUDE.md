# Function Documentation App (fundocs)

## What is this?
eXist-db's built-in XQuery function browser/search tool. It scans installed XQuery modules and generates browsable documentation using xqDoc.

## Build & Test

```bash
# Build the XAR package
mvn clean package

# Run Cypress E2E tests (requires a running eXist-db instance on localhost:8080)
npx cypress run

# Run smoke tests
bats --tap src/test/bats/*.bats
```

## Architecture

- **Backend:** XQuery modules running inside eXist-db
  - `modules/generate.xqm` - Scans modules and generates xqDoc XML
  - `modules/app.xqm` - Search/browse logic, HTML templating functions
  - `modules/config.xqm` - App configuration
  - `controller.xq` - URL routing
  - `finish.xq` - Post-install hook (triggers doc generation)
  - `modules/regenerate.xq` - Manual regeneration endpoint (requires DBA)

- **Frontend:** Bootstrap 5, Bootstrap Icons, highlight.js, zero-md
  - `resources/scripts/query.js` - Search, regeneration, deprecated toggle
  - `frontend/sass/` - SCSS stylesheets (compiled via Gulp)
  - `templates/page.html` - Master layout
  - `templates/pages/` - Individual page templates

- **Build:** Maven + frontend-maven-plugin (Node/npm/Gulp)
  - `gulpfile.js` - SCSS compilation, vendor asset copying, SVG optimization
  - `pom.xml` - Maven build config, XAR packaging

## Key Conventions

- Templates use eXist-db's HTML templating (`data-template` attributes)
- Icons use Bootstrap Icons (`bi bi-*` classes)
- CSS uses Bootstrap 5 utility classes + custom SCSS
- The app targets eXist-db 7.x with Java 17+
- Node 20 LTS is required for the frontend build

## Testing

- E2E tests in `src/test/cypress/integration/`
- Smoke tests in `src/test/bats/`
- Tests run against a Docker eXist-db instance in CI

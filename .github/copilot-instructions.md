# ashram-strona

**Project Type:** Project
**Languages:** Typescript
**Version:** 0.0.1

## Technology Stack

### Frameworks
- Astro (5.17.1)

### Testing
- Playwright

### Package Manager
- Npm


## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

```

## Code Conventions


### Patterns
- **API Style:** rest
- **Testing:** playwright

## Project Structure

**Structure Type:** src-based
**Source Directory:** `src/`
**Test Directory:** `tests/`

### Important Files
- `package.json`
- `tsconfig.json`
- `README.md`
- `CONTRIBUTING.md`

## Development Guidelines

### TypeScript
- Use strict TypeScript with proper type annotations
- Prefer `interface` for object types, `type` for unions/intersections
- Avoid `any` - use `unknown` when type is uncertain

### General
- Follow existing code patterns and conventions
- Write clear, self-documenting code
- Keep functions small and focused
- Add tests for new functionality
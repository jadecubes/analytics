# Contributing

## Development

### Project Structure

```
analytics/
├── libs/analytics/
│   ├── src/
│   │   ├── index.ts                     # Public exports
│   │   ├── createAnalyticsProviders.ts  # Sets up platforms, returns instances
│   │   ├── core/                        # Base class and one class per platform, with tests
│   │   └── types/                       # Event type and window globals
│   ├── package.json                     # The published package
│   └── vite.config.ts                   # Build and test config
├── tools/                               # Pre-push check
├── README.md
└── LICENSE
```

### Available Scripts

```bash
# Build the library
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint
```

The pre-push hook runs `pnpm build` (which type-checks) and `pnpm lint`; CI also runs the tests on Node 20 and 22.

## Publishing to npm

This library is published as `@jadecubes/analytics` on npm. If you're a maintainer, follow these steps to publish a new version:

### Prerequisites

1. **npm Account**: Ensure you have an npm account and are logged in
   ```bash
   npm login
   ```

2. **Organization Access**: You need publish access to the `@jadecubes` organization on npm

### Publishing Steps

1. **Update Version**: Update the version in `libs/analytics/package.json` following [semantic versioning](https://semver.org/):
   - **Patch** (0.0.x): Bug fixes
   - **Minor** (0.x.0): New features, backward compatible
   - **Major** (x.0.0): Breaking changes

   ```bash
   # Edit libs/analytics/package.json and update the version field
   # For example: "version": "0.0.2"
   ```

2. **Build the Library**:
   ```bash
   pnpm build
   ```

3. **Test the Build**: Verify the build output in `dist/libs/analytics/`
   ```bash
   ls -la dist/libs/analytics/
   ```

4. **Copy package.json, README.md and LICENSE to dist**: all three need to be in the published directory
   ```bash
   cp libs/analytics/package.json README.md LICENSE dist/libs/analytics/
   ```

5. **Publish to npm**:
   ```bash
   cd dist/libs/analytics
   npm publish --access public
   ```

### Automated Publishing (Recommended)

Run the root `package.json`'s publish script, which does steps 2, 4 and 5 for you:

```bash
pnpm publish:analytics
```

### Publishing Beta/Alpha Versions

For pre-release versions, set a pre-release version such as `0.1.0-beta.1` (step 1), build and copy (steps 2 and 4), then publish with a tag:

```bash
cd dist/libs/analytics
npm publish --access public --tag beta
```

# QueryFlow - Publish Checklist

## ✅ Pre-Publish Checklist

### Build
- [x] Build succeeds (`npm run build`)
- [x] All entry points built
- [x] ESM + CJS dual format
- [x] Source maps generated

### Package
- [x] package.json configured
- [x] exports field complete
- [x] peer dependencies optional
- [x] Zero runtime dependencies
- [x] 12 keywords included

### Documentation
- [x] README.md complete
- [x] llms.txt included
- [x] LICENSE (MIT)
- [x] CHANGELOG.md

### Tests
- [ ] All tests passing (100%)
- [ ] Coverage report generated

### Files
- [x] dist/ directory contains builds
- [x] All entry points present
- [x] No source files in dist/

## 📦 Package Information

**Name:** @oxog/queryflow  
**Version:** 1.0.0  
**License:** MIT  
**Author:** Ersin Koç  

## 🚀 Publish Commands

```bash
# 1. Verify build
npm run build

# 2. Run tests
npm run test

# 3. Check type safety
npm run typecheck

# 4. Preview package
npm pack

# 5. Publish to npm
npm publish
```

## 📦 Bundle Sizes

- index.js: ~36KB (unminified)
- plugins/index.js: ~28KB (unminified)
- React binding: ~24KB (unminified)
- Vue binding: ~24KB (unminified)
- Solid binding: ~24KB (unminified)
- Svelte binding: ~24KB (unminified)

## 🔗 Links

- **GitHub:** https://github.com/ersinkoc/queryflow
- **npm:** https://www.npmjs.com/package/@oxog/queryflow
- **Docs:** https://queryflow.oxog.dev

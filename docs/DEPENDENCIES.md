# Dependencies Documentation

## Development Dependencies

### @babel/plugin-proposal-private-property-in-object

**Why it's needed**: This dependency is required to work around a bug in `babel-preset-react-app` from the unmaintained `create-react-app` project.

**Technical Details**: 
- `babel-preset-react-app` imports this package without declaring it in its own dependencies
- Without this explicit dependency, builds may fail unpredictably
- This is a known issue with create-react-app: https://github.com/facebook/create-react-app/issues/11773

**Deprecation Notice**: This plugin is deprecated in favor of `@babel/plugin-transform-private-property-in-object` but we must use the old version to maintain compatibility with the unmaintained create-react-app preset.

**Status**: Required until we migrate away from create-react-app or the upstream issue is resolved (unlikely since CRA is unmaintained).

**Testing Impact**: Without this dependency, tests fail with warnings about missing babel plugins, though they may still pass in some environments.
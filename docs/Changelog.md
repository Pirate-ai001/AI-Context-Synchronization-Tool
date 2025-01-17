# Changelog

## Version 1.0 (January 17, 2025)

### Major Architecture Changes
- Converted to class-based structure
- Migrated to ES modules
- Added lodash for utility functions
- Implemented proper async/await patterns

### New Features
- Debug mode for detailed logging
- Configurable watch directories
- Enhanced pattern matching for file relationships
- File write stability thresholds
- Comprehensive logging system with colored output

### Dependencies
- Added lodash for utility functions
- Added chalk for improved console output
- Added JSON5 for enhanced configuration
- Updated import patterns for ESM compatibility

### Performance Improvements
- Implemented debouncing with lodash
- Optimized git diff execution
- Used Sets for pattern matching
- Improved file system operations with fs/promises

### Configuration
- New config.json5 format with additional options:
  - watchAllFiles toggle
  - debugMode option
  - configurable debounceTime
  - watchDirectories array
  - customizable ignoredPatterns

### Bug Fixes
- Fixed ESM/CommonJS module compatibility issues
- Improved Windows path handling
- Enhanced error handling for file operations
- Better handling of configuration file changes

## Version 1.1.0 (Previous Release)

[Previous release notes...]
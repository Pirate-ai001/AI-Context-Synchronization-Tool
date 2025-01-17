# Context Sync Tool

## Overview
The **Context Sync Tool** is designed to streamline collaboration with AI in coding projects. It helps to monitor project files for changes, track related file dependencies, and provide a dynamic context to AI models to improve the collaboration process.

## Features
- **Intelligent File Monitoring**: Advanced file system monitoring with debouncing and stability thresholds
- **Relational Map Support**: Track interdependencies between files using a flexible mapping system
- **Git Integration**: Utilizes git diff to track changes effectively
- **Smart Error Handling**: Comprehensive error logging with colored output
- **Dynamic Configuration**: JSON5-based configuration with hot-reload support
- **Pattern Matching**: Support for glob patterns in file matching
- **Debug Mode**: Optional detailed logging for troubleshooting
- **Performance Optimized**: Efficient file watching with debouncing and caching

## Project Structure
```
Context_Sync_Tool/
├── Configuration/
│   └── config.json5         # Main configuration file
├── docs/
│   ├── README.md           # This file
│   └── LICENSE.txt         # License information
├── scripts/
│   └── file_monitoring.js  # Main monitoring script
├── dummy-project/          # Example project for testing
│   ├── src/               # Example source files
│   └── .gitignore         # Project-specific ignores
├── .gitignore             # Tool-specific ignores
└── package.json           # Dependencies and scripts
```

## Installation

1. Clone the repository:
    ```bash
    git clone <repo_url>
    cd Context_Sync_Tool
    ```

2. Install dependencies:
    ```bash
    pnpm install
    ```

    Or install individual packages:
    ```bash
    pnpm add chokidar
    pnpm add chalk
    pnpm add json5
    pnpm add lodash
    ```

3. Run the monitoring script:
    ```bash
    pnpm run monitor
    ```

## Configuration

The tool uses a JSON5 configuration file (`config.json5`) with enhanced features:

```json5
{
  // Enable/disable monitoring of all files
  watchAllFiles: true,
  
  // Enable detailed debug logging
  debugMode: false,
  
  // Delay between processing changes (ms)
  debounceTime: 300,
  
  // Patterns to ignore (in addition to .gitignore)
  ignoredPatterns: [
    "node_modules/**",
    "dist/**",
    "*.log"
  ],
  
  // Directories to watch (when watchAllFiles is false)
  watchDirectories: [
    "./src/**/*"
  ],
  
  // Define file relationships
  relationalMap: {
    "src/components/sidebar.tsx": [
      "src/layout.tsx",
      "src/app.tsx"
    ],
    "tailwind.config.js": [
      "src/components/**/*.tsx"
    ]
  }
}
```

## Gitignore Files
The tool uses two separate .gitignore files:

1. **Tool's .gitignore** (`/Context_Sync_Tool/.gitignore`):
   - Manages version control for the tool itself
   - Ignores development-related files (node_modules, logs, etc.)
   - Should not be modified by users

2. **Project's .gitignore** (`/dummy-project/.gitignore`):
   - Used by the monitoring functionality
   - Determines which files to exclude from monitoring
   - Can be customized for specific projects

## Usage

### Starting the Monitor
Run the tool using:
```bash
pnpm run monitor
```

### Understanding the Output
The tool uses color-coded console output:
- 🟢 **Green**: Information and success messages
- 🔵 **Blue**: Debug information (when debug mode is enabled)
- 🟡 **Yellow**: Warnings and related file notifications
- 🔴 **Red**: Errors and failure messages

### Monitoring Modes
1. **Watch All Files Mode**:
   - Set `watchAllFiles: true` in config
   - Monitors all files except ignored patterns

2. **Relational Map Mode**:
   - Set `watchAllFiles: false` in config
   - Only monitors files specified in the relational map
   - Uses glob pattern matching for file relationships

### Debug Mode
Enable debug mode in config.json5 to see detailed logging:
```json5
{
  debugMode: true
}
```

## Troubleshooting

Common issues and solutions:

1. **Module Import Errors**:
   - Ensure all dependencies are installed
   - Check package.json for correct dependency versions

2. **File Watching Issues**:
   - Verify paths in config.json5
   - Check .gitignore patterns
   - Ensure file permissions are correct

3. **Performance Issues**:
   - Adjust debounceTime in config
   - Review ignoredPatterns
   - Check watchDirectories paths

## License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License - see the [LICENSE.txt](docs/LICENSE.txt) file for details.

You may not use this work for commercial purposes. You are free to share and adapt the material for non-commercial purposes, as long as you:
- Give appropriate credit
- Provide a link to the license
- Indicate if changes were made

For more information, visit: https://creativecommons.org/licenses/by-nc/4.0/
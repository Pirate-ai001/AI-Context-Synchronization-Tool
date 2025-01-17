# Context Sync Tool

The **Context Sync Tool** is designed to streamline collaboration with AI in coding projects. It helps to monitor project files for changes, track related file dependencies, and provide a dynamic context to AI models to improve the collaboration process.

## What Does This Tool Do?

Imagine you're working on a project with multiple files that are connected to each other. When you change one file, you often need to update other related files. This tool helps by:

1. Watching your files for changes
2. Telling you which other files might need attention
3. Helping AI tools understand the connections between your files

## Features

- **File Monitoring**: Watches your project files and notices when you make changes
- **Smart File Connections**: Knows which files are related to each other using a simple map
- **Git Integration**: Uses Git to track what files have changed
- **Helpful Error Messages**: Shows clear, colored messages to help you understand what's happening
- **Auto-Updates**: Automatically notices when you change how files are connected
- **Ignores Unnecessary Files**: Automatically skips files you don't want to track (like node_modules)
- **Prevents Overload**: Waits a short time after changes to avoid processing too many updates at once

## Project Structure

Here's how the tool is organized:

```
/Context_Sync_Tool
├── Configuration/           # Where settings live
│   └── config.json5        # Main settings file
├── docs/                   # Documentation
│   ├── README.md          # This file
│   └── LICENSE.txt        # License information
├── scripts/               # The tool's code
│   └── file_monitoring.js # Main script
├── dummy-project/         # Example project to test with
│   ├── src/              # Example source files
│   │   ├── components/   # Example components
│   │   └── app.tsx      # Example main file
│   └── .gitignore       # What files to ignore in the project
├── .gitignore            # What files to ignore in the tool
└── package.json          # Tool dependencies
```

## Two Different .gitignore Files Explained

This tool uses two separate .gitignore files, each with a different purpose:

1. **Tool's .gitignore** (in the main folder):
   - This is for the tool itself
   - Ignores things like:
     ```gitignore
     node_modules/     # Installed packages
     .vscode/         # Editor settings
     *.log           # Log files
     ```
   - You don't need to change this one

2. **Project's .gitignore** (in dummy-project):
   - This is for your actual project
   - Shows what files the tool should ignore while monitoring
   - You can copy this to your own project and modify it

## Getting Started

### 1. First-Time Setup

Clone (download) the tool:
```bash
git clone <repo_url>
cd Context_Sync_Tool
```

### 2. Install Dependencies

The easiest way:
```bash
pnpm install
```

If starting from scratch, install each package:
```bash
pnpm add chokidar   # For watching files
pnpm add chalk      # For colored console messages
pnpm add json5      # For reading configuration
```

### 3. Try the Example Project

Run the monitoring script:
```bash
pnpm run monitor
```

You should see colorful messages in your console showing that the tool is working!

## Configuration Guide

The tool uses a config.json5 file that's easy to customize:

### Basic Configuration Example
```json5
{
  // Watch all files or just ones in the map?
  "watchAllFiles": true,
  
  // How long to wait before processing changes (in milliseconds)
  "debounceTime": 100,
  
  // Files to ignore (besides .gitignore)
  "ignoredPatterns": [
    "node_modules/**",
    "dist/**",
    "*.log"
  ],
  
  // How files are connected to each other
  "relationalMap": {
    // When sidebar.tsx changes, check these files:
    "src/components/sidebar.tsx": [
      "src/layout.tsx",
      "src/app.tsx"
    ],
    // When tailwind config changes, check all component files:
    "tailwind.config.js": [
      "src/components/**/*.tsx"
    ]
  }
}
```

### Using with Your Own Project

1. Copy the dummy-project's structure as a reference
2. Update config.json5 with your project's paths
3. Modify the relational map to match your file dependencies

Example project structure you might have:
```
your-project/
├── src/
│   ├── components/
│   │   └── your-components.tsx
│   └── app.tsx
├── .gitignore
└── config.json5
```

## Understanding the Output

When you run the tool, you'll see colored messages:
- 🟢 **Green**: Normal information and file changes
- 🔵 **Blue**: Related files that might need attention
- 🟡 **Yellow**: Warnings or things to be aware of
- 🔴 **Red**: Errors that need attention

Example output:
```
[Green] Starting file monitoring system...
[Green] File changed: src/components/sidebar.tsx
[Blue] Related files that may need attention:
[Yellow]   → src/layout.tsx
[Yellow]   → src/app.tsx
```

## Troubleshooting Guide

Common issues and solutions:

1. **Tool can't find config file**
   - Make sure you're in the right directory
   - Check if Configuration/config.json5 exists

2. **No file changes detected**
   - Check if watchAllFiles is true in config
   - Verify file paths in relationalMap

3. **Tool isn't ignoring node_modules**
   - Check your .gitignore file
   - Verify ignoredPatterns in config

## Contributions

Want to help improve this tool? Here's how:
1. Fork the repository
2. Create a new branch for your changes
3. Make your improvements
4. Submit a pull request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License - see the [LICENSE.txt](docs/LICENSE.txt) file for details.

You may not use this work for commercial purposes. You are free to share and adapt the material for non-commercial purposes, as long as you:
- Give appropriate credit
- Provide a link to the license
- Indicate if changes were made

For more information, visit: https://creativecommons.org/licenses/by-nc/4.0/
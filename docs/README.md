# Context Sync Tool

## Overview
The **Context Sync Tool** is a file monitoring utility designed to track & monitor changes within a project directory, execute Git diffs and log the status of any changes detected in files. It integrates seamlessly into your main project and provides live feedback on the status of file changes while tracking whether the system is idle or active. This tool is useful for syncing context in development environments with AI Chatbots (eg. Claude, ChatGPT etc) and tracking any updates that occur across a corresponding local folder &/or Git Repository.

## Installation

1. Clone the repository:
    ```bash
    git clone <repo_url>
    cd Context_Sync_Tool
    ```

2. Install dependencies:
    ```bash
    pnpm install
    pnpm add chokidar
    pnpm add chalk
    pnpm add json5
    pnpm add lodash
    ```

3. Run the monitoring script:
    ```bash
    pnpm run monitor
    ```

## Understanding the Dummy Project

### What is the Dummy Project?
The dummy project is a pre-configured example project included with the tool that serves multiple purposes:

1. **Learning Environment**: 
   - Demonstrates how the tool works in a real project structure
   - Shows correct configuration setup
   - Provides working examples of file relationships

2. **Testing Ground**:
   - Allows you to test the tool without risking your own project
   - Includes common file types and structures
   - Demonstrates proper gitignore patterns

3. **Configuration Template**:
   - Contains pre-configured settings you can reference
   - Shows how to set up file relationships
   - Provides examples of ignore patterns

### How to Use the Dummy Project

1. **Initial Testing**:
   ```bash
   # Start the tool with dummy project
   pnpm run monitor
   ```
   - Make changes to dummy project files
   - Observe how the tool tracks relationships
   - Experiment with different file types

2. **Learning from Examples**:
   - Review the dummy project's structure
   - Understand the configuration patterns
   - See how file relationships are defined

3. **Adapting to Your Project**:
   - Use dummy project as a template
   - Copy and modify configurations
   - Adjust paths and patterns for your needs

## Features
- **Intelligent File Monitoring**: Advanced file system monitoring with debouncing and stability thresholds
- **Relational Map Support**: Track interdependencies between files using a flexible mapping system
- **Git Integration**: Utilizes git diff to track changes effectively
- **Smart Status Logging**: Shows detailed git status including added, modified, and deleted files
- **Error Handling**: Includes detailed error handling and logging to help troubleshoot any issues
- **Dynamic Configuration**: JSON5-based configuration with hot-reload support
- **Pattern Matching**: Support for glob patterns in file matching
- **Debug Mode**: Optional detailed logging for troubleshooting
- **Performance Optimized**: Efficient file watching with debouncing and caching
- **Idle Status Tracking**: Monitors and reports system idle state

## Working with Claude

### Understanding AI Integration
The tool's primary purpose is to enhance development workflows by maintaining rich, structured context for Claude. Here's how it works:

#### Context Generation and Analysis
When you make changes to your code, the tool automatically:
- Captures actual code content with intelligent analysis
- Creates detailed change summaries
- Maps file dependencies and relationships
- Maintains project structure context
- Formats everything specifically for Claude's understanding

#### Using Generated Context with Claude

1. **Direct Integration**
   - Find your context file at `./AI_Context/claude/context.txt`
   - Copy the content into your Claude conversation
   - Get immediate, context-aware development assistance

2. **Development Workflow Example**
   ```bash
   # With tool running:
   1. Make your code changes
   2. Tool updates context automatically
   3. Share context with Claude:
      "Here's my latest context from the sync tool. Could you:
       - Review my changes to the auth system?
       - Suggest any security improvements?
       - Help write tests for the new features?"
   4. Get context-aware responses from Claude
   ```

3. **What to Ask Claude**
   With this rich context, Claude can help:
   - Review code changes for issues
   - Suggest implementation improvements
   - Identify documentation needs
   - Recommend test cases
   - Analyze change impacts
   - Understand complex dependencies

#### Template Customization
You can customize how context is presented to AI models:

1. **Available Templates**
   - Claude template: `./AI_Context/claude/templates/default.md`
   - ChatGPT template: `./AI_Context/chatgpt/templates/default.json`
   - Add your own templates for other AI models

2. **Switching Templates**
   In config.json5, specify your preferred model:
   ```json5
   aiOutputConfig: {
     enabled: true,
     models: {
       claude: {
         enabled: true,
         outputPath: "./AI_Context/claude/context.txt",
         format: "markdown"
       },
       chatgpt: {
         enabled: true,
         outputPath: "./AI_Context/chatgpt/context.json",
         format: "json"
       },
       // Add other AI models here
       yourModel: {
         enabled: true,
         outputPath: "./AI_Context/yourModel/context.txt",
         format: "your-format"
       }
     }
   }
   ```

3. **Creating New Templates**
   - Copy existing templates as starting points
   - Place new templates in `./AI_Context/[model-name]/templates/`
   - Update config.json5 to reference your new template
   - Follow format requirements for your chosen AI model

#### Context History
- Access previous contexts in `./AI_Context/history`
- Track project evolution over time
- Compare different development states
- Maintain comprehensive change history

#### Best Practices
1. **Regular Updates**
   - Commit changes regularly
   - Use descriptive commit messages
   - Keep context fresh and relevant

2. **Project Structure**
   - Maintain clear organization
   - Define meaningful file relationships
   - Use consistent naming patterns

3. **Context Verification**
   - Check context updates after changes
   - Monitor debug output
   - Verify relationship tracking

#### Troubleshooting AI Integration
If Claude seems to misunderstand the context:
1. Verify context file was updated
2. Check if relevant files are being tracked
3. Enable debug mode for detailed logging
4. Review template configuration
5. Check relationship mappings

## Project Structure
```
Context_Sync_Tool/
├── Configuration/
│   └── config.json5         # Main configuration file
├── docs/
│   ├── README.md           # Documentation
│   └── LICENSE.txt         # License information
├── scripts/
│   └── file_monitoring.js  # Main monitoring script
├── dummy-project/          # Example project for testing
│   ├── src/               # Example source files
│   └── .gitignore         # Project-specific ignores
├── .gitignore             # Tool-specific ignores
└── package.json           # Dependencies and scripts
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
  
  // Git configuration
  gitConfig: {
    enabled: true,
    repositoryPath: "path/to/your/repo",
    branch: "main",
    showGitStatus: true
  },
  
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

**Note**: Ensure to use `/` (forward slashes) in the paths, even on Windows systems.

### File Relationship Tracking

The tool provides an advanced **Relational Map** feature that allows you to define sophisticated file relationships using two matching strategies:

#### Exact File Mapping
Define direct, one-to-one relationships between specific files:

```json5
{
  relationalMap: {
    "src/components/sidebar.tsx": [
      "src/layout.tsx",
      "src/app.tsx"
    ]
  }
}
```

#### Glob Pattern Matching
Use wildcard patterns to match multiple files dynamically:

```json5
{
  relationalMap: {
    "tailwind.config.js": [
      "src/components/**/*.tsx"
    ],
    "src/styles/**/*.css": [
      "src/components/**/*.tsx"
    ]
  }
}
```

#### Key Features of Related Files Tracking:
- Supports precise file path matching
- Implements advanced glob-style pattern recognition
- Automatically removes duplicate related file entries
- Provides comprehensive debug logging of file relationships
- Enables flexible configuration for complex project structures

#### How Related Files Work
When a file is modified:
1. The tool instantly checks for exact file matches in the relational map
2. Applies sophisticated glob pattern matching to discover related files
3. Generates detailed debug logs about discovered file relationships
4. Can trigger context updates or notifications for interconnected files

**Tip**: Enable `debugMode: true` in the configuration to receive detailed insights about file relationship detection and matching processes.

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
- 🟡 **Yellow**: Warnings and modified files
- 🔴 **Red**: Errors and deleted files

### Git Diff Integration
The tool executes the following Git diff command to detect changes:
```bash
git diff --name-only
```
This command returns the list of files that have been modified, added, or removed in the repository.

### Idle Status
If no changes are detected for 5 minutes, the tool will log an idle status indicating that it is monitoring for changes but no activity is being processed.

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

4. **Git Integration Issues**:
   - Verify repository path
   - Check branch configuration
   - Ensure git is initialized

## Contributing
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
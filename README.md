# Context Sync Tool

## Overview

The **Context Sync Tool** is a file monitoring utility designed to track changes within a project directory, execute Git diffs, and log the status of any changes detected in files. It integrates seamlessly into your main project and provides live feedback on the status of file changes while tracking whether the system is idle or active. This tool is useful for syncing context in development environments and tracking any updates that occur across a corrosponding repository.

## Features

- Monitors changes in the project directory using `chokidar`.
- Executes a Git diff command to track changes when files are modified.
- Excludes certain files/folders from being watched (e.g., `node_modules`, `.git`, etc.).
- Logs activity such as file changes, additions, removals, and errors.
- Periodically logs the idle status to indicate when the tool is not actively processing.
- Handles `.gitignore` files to exclude ignored files from monitoring.

## Installation

1. Clone the repository or navigate to the relevant branch where the tool is located.

    ```bash
    git clone <repository-url>
    ```

2. Navigate to the **Context Sync Tool** folder:

    ```bash
    cd C:/Users/Ben/Desktop/Coding/AIProject01/Branches/dev/Administrative_Actions/Other_Tools/Context_Sync_Tool
    ```

3. Install required dependencies:

    ```bash
    pnpm install
    ```

## Usage

To use the **Context Sync Tool**, run the following command from the **Context Sync Tool** folder:

node contextSyncTool.js
This will initialize the file monitoring process. The tool will monitor the directory for changes, and on detecting any changes, it will execute the Git diff command and log the relevant changes.

Logs
Logs will be printed to the terminal or command line in real-time.
Logs are color-coded for easier reading:
Green: Information logs
Yellow: Warning logs
Red: Error logs
Git Diff Command
The tool executes the following Git diff command to detect changes:

bash
Copy code
git diff --name-only
This command returns the list of files that have been modified, added, or removed in the repository.

Idle Status
If no changes are detected for 5 minutes, the tool will log an idle status indicating that it is monitoring for changes but no activity is being processed.

Troubleshooting
Common Issues

1. Git diff fails
If you encounter an error related to the Git diff command, ensure that:
You have Git installed and available in your system PATH.
Your working directory is correctly set to the project root.

2. No files detected
If the tool is not detecting changes, verify the following:
Check if the files you are modifying are not ignored by .gitignore.
Ensure that the file changes are saved before the tool processes them.

3. Watcher errors
If the watcher encounters issues, ensure that:
The required dependencies are correctly installed.
The path to the directory is accessible and there are no permissions issues.
Maintenance and Support

For more information on maintaining this tool or extending its functionality, refer to the tool documentation in the maintenance directory.
For assistance or support, contact the development team or check the project’s issue tracker.

Example Log Output
When changes are detected, logs will be printed to the terminal:

[2025-01-15T12:34:56.789Z] [INFO]: File changed: /path/to/changed/file.js
[2025-01-15T12:34:56.789Z] [INFO]: Detected change in file: /path/to/changed/file.js
[2025-01-15T12:34:56.789Z] [INFO]: Executing Git diff command: "git diff --name-only"
[2025-01-15T12:34:56.789Z] [INFO]: Git diff returned 3 changes.
[2025-01-15T12:34:56.789Z] [INFO]: Files detected with changes: /path/to/changed/file1.js, /path/to/changed/file2.js
This log output helps developers track the exact changes detected by the tool and any actions that follow.

Key Considerations

Performance: The tool runs continuously in the background to monitor file changes. For large projects, ensure that the list of ignored files is comprehensive to avoid unnecessary processing.
Security: Ensure that the tool is not monitoring sensitive or confidential files, especially if integrated into production environments.
Extensions: The tool can be easily extended to perform additional actions on file changes, such as running tests, triggering builds, or notifying team members.

License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License.
You may not use this project for commercial purposes. For more details, refer to the LICENSE file.

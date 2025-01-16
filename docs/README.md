# Context Sync Tool

The **Context Sync Tool** is designed to streamline collaboration with AI in coding projects. It helps to monitor project files for changes, track related file dependencies, and provide a dynamic context to AI models to improve the collaboration process.

## Features

- **File Monitoring**: Monitors file changes in the project and tracks the relevant files using a relational map.
- **Relational Map Support**: Integrates a relational map to track interdependencies between files and ensure the AI gets the right context.
- **Git Diff Integration**: Utilizes `git diff` to detect changes and identify affected files.
- **Error Logging**: Includes detailed error handling and logging to help troubleshoot any issues.
- **Automatic Relational Map Reload**: Monitors changes to the relational map file and updates the AI context accordingly.

## Project Structure

The tool is structured into the following directories:

- `Configuration/`: Contains configuration files such as the relational map.
- `docs/`: Documentation and troubleshooting guides.
- `scripts/`: Contains the main scripts for monitoring and syncing contexts.

### Example Directory Layout:

/Context_Sync_Tool ├── Configuration │ └── relational_map.json ├── docs │ └── README.md ├── scripts │ └── file_monitoring.js └── LICENSE.txt


## Setup Instructions

1. Clone the repository:

    ```bash
    git clone <repo_url>
    cd Context_Sync_Tool
    ```

2. Install dependencies:

    ```bash
    pnpm install
    ```

3. Run the file monitoring script:

    ```bash
    pnpm run monitor
    ```

## Usage

### Monitoring Files

- The tool will start monitoring the project's files and log any changes detected.
- If a file is changed, the tool will check if there are any related files that need attention, based on the relational map.

### Relational Map

- The **relational map** defines the relationships between files and their dependencies.
- The tool loads the relational map and updates the AI context dynamically whenever a file change is detected.

### Error Handling and Troubleshooting

- The tool logs important events, including errors, file changes, and related file processing, into the console for easy troubleshooting.
- Ensure that the `relational_map.json` file is properly formatted and located in the **Configuration** folder. If there are issues loading it, check the logs for more details.

## Contributions

If you'd like to contribute to this project, please fork the repository, create a new branch, and submit a pull request with your proposed changes.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.

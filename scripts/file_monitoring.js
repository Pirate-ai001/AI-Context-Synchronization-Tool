import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

const projectRoot = path.resolve(process.cwd());
const gitignorePath = path.resolve(projectRoot, '.gitignore');
const gitCommand = 'git diff --name-only';
const relationalMapPath = 'C:\\Users\\Ben\\Desktop\\Coding\\AIProject01\\Branches\\dev\\Administrative_Actions\\Other_Tools\\Context_Sync_Tool\\Configuration\\relational_map.json';

let isIdle = true;
let isStatusLogged = false;
let firstIdle = true;
let watcherStatus = 'idle';
let relationalMap = null;

// Log utility function
const log = (type, message) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}]: ${message}`;

    const colorMap = {
        info: '\x1b[32m%s\x1b[0m',
        warn: '\x1b[33m%s\x1b[0m',
        error: '\x1b[31m%s\x1b[0m',
        default: '%s'
    };
    
    console.log(colorMap[type] || colorMap.default, formattedMessage);
};

// Read .gitignore file and return patterns to ignore
const readGitIgnore = () => {
    try {
        if (fs.existsSync(gitignorePath)) {
            log('info', `.gitignore found at ${gitignorePath}`);
            return fs.readFileSync(gitignorePath, 'utf8').split(/\r?\n/).filter(Boolean);
        } else {
            log('warn', `.gitignore not found. All files will be monitored.`);
            return [];
        }
    } catch (error) {
        log('error', `Error reading .gitignore: ${error.message}`);
        return [];
    }
};

// Check if a file is ignored based on .gitignore patterns
const isIgnored = (filePath, gitIgnorePatterns) => {
    return gitIgnorePatterns.some(pattern => {
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
        return regex.test(filePath);
    });
};

// Load relational map from a JSON file, with error handling
const loadRelationalMap = () => {
    try {
        if (fs.existsSync(relationalMapPath)) {
            log('info', `Loading relational map from ${relationalMapPath}`);
            const fileContent = fs.readFileSync(relationalMapPath, 'utf8');
            const jsonStartIndex = fileContent.indexOf('{');
            
            if (jsonStartIndex === -1) {
                throw new Error('Invalid relational map format. No JSON object found.');
            }
            
            const jsonContent = fileContent.substring(jsonStartIndex);
            relationalMap = JSON.parse(jsonContent);
            log('info', 'Relational map loaded successfully');
        } else {
            log('warn', `Relational map not found at ${relationalMapPath}`);
        }
    } catch (error) {
        log('error', `Failed to load relational map: ${error.message}`);
    }
};

// Process related files based on the relational map
const processRelatedFiles = (changedFile) => {
    if (!relationalMap) return [];

    const relatedFiles = relationalMap[changedFile] || [];
    if (relatedFiles.length) {
        log('info', `Found related files for ${changedFile}: ${relatedFiles.join(', ')}`);
    }

    return relatedFiles;
};

// Execute the Git diff command to get modified files
const getGitDiff = () => {
    return new Promise((resolve, reject) => {
        log('info', `Executing Git diff command: "${gitCommand}"`);
        exec(gitCommand, { cwd: projectRoot }, (error, stdout) => {
            if (error) {
                log('error', `Git diff command failed: ${error.message}`);
                reject(error);
            } else {
                const changes = stdout.split(/\r?\n/).filter(Boolean);
                log('info', `Git diff returned ${changes.length} changes.`);
                resolve(changes);
            }
        });
    });
};

// Initialize the file monitoring process
const monitorFiles = async () => {
    log('info', `Initializing monitoring process in ${projectRoot}`);
    loadRelationalMap();  // Load the relational map at startup
    const gitIgnorePatterns = readGitIgnore();

    // Set up the file watcher
    log('info', 'Setting up file watcher...');
    const watcher = chokidar.watch(projectRoot, {
        persistent: true,
        ignored: [
            /node_modules/,
            /\.git/,
            /\.vs/,
            /\.(db|log)$/
        ]
    });

    // Handle file change events
    watcher.on('change', async (filePath) => {
        watcherStatus = 'active';
        const relativePath = path.relative(projectRoot, filePath);
        log('info', `File changed: ${relativePath}`);

        if (!isIgnored(relativePath, gitIgnorePatterns)) {
            isIdle = false;
            
            try {
                const changedFiles = await getGitDiff();
                log('info', `Files detected with changes: ${changedFiles.join(', ')}`);

                // Process related files
                const relatedFiles = processRelatedFiles(relativePath);
                if (relatedFiles.length > 0) {
                    log('info', `Related files that may need attention: ${relatedFiles.join(', ')}`);
                }
            } catch (err) {
                log('error', `Failed to get Git diff: ${err.message}`);
            }

            isIdle = true;
            if (firstIdle) {
                log('info', `Status: [IDLE] (no tasks in progress, monitoring for changes).`);
                firstIdle = false;
            }
        }
    });

    // Watch the relational map file for changes
    watcher.add(relationalMapPath);
    watcher.on('change', (filePath) => {
        if (filePath === relationalMapPath) {
            log('info', 'Relational map file changed, reloading...');
            loadRelationalMap();
        }
    });

    // Watch for new files or removed files
    watcher.on('add', (filePath) => {
        watcherStatus = 'active';
        log('info', `File added: ${filePath}`);
    });

    watcher.on('unlink', (filePath) => {
        watcherStatus = 'active';
        log('info', `File removed: ${filePath}`);
    });

    // Monitor idle status
    setInterval(() => {
        if (isIdle && !isStatusLogged) {
            log('info', `Status: [IDLE] (no tasks in progress, monitoring for changes).`);
            isStatusLogged = true;
        } else if (!isIdle) {
            isStatusLogged = false;
        }
    }, 300000);
};

// Startup message and initiation
log('info', 'Starting monitoring tool with relational map support...');
monitorFiles();

import chokidar from 'chokidar';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

const projectRoot = path.resolve(process.cwd());
const gitignorePath = path.resolve(projectRoot, '.gitignore');
const gitCommand = 'git diff --name-only';

let isIdle = true;
let isStatusLogged = false;
let firstIdle = true; // Flag for first idle log
let watcherStatus = 'idle'; // Track the state of the watcher

const log = (type, message) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${type.toUpperCase()}]: ${message}`;
    console.log(
        type === 'info' ? '\x1b[32m%s\x1b[0m' : // Green for info
        type === 'warn' ? '\x1b[33m%s\x1b[0m' : // Yellow for warnings
        type === 'error' ? '\x1b[31m%s\x1b[0m' : // Red for errors
        '%s',
        formattedMessage
    );
};

const readGitIgnore = () => {
    if (fs.existsSync(gitignorePath)) {
        log('info', `.gitignore found at ${gitignorePath}`);
        return fs.readFileSync(gitignorePath, 'utf8').split(/\r?\n/).filter(Boolean);
    } else {
        log('warn', `.gitignore not found. All files will be monitored.`);
        return [];
    }
};

const isIgnored = (filePath, gitIgnorePatterns) => {
    return gitIgnorePatterns.some(pattern => {
        const regex = new RegExp(
            `^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`
        );
        return regex.test(filePath);
    });
};

const getGitDiff = () => {
    return new Promise((resolve, reject) => {
        log('info', `Executing Git diff command: "${gitCommand}"`);
        exec(gitCommand, { cwd: projectRoot }, (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                const changes = stdout.split(/\r?\n/).filter(Boolean);
                log('info', `Git diff returned ${changes.length} changes.`);
                resolve(changes);
            }
        });
    });
};

const monitorFiles = async () => {
    log('info', `Initializing monitoring process in ${projectRoot}`);
    const gitIgnorePatterns = readGitIgnore();

    log('info', 'Setting up file watcher...');
    const watcher = chokidar.watch(projectRoot, {
        persistent: true,
        ignored: [
            /node_modules/, // Exclude node_modules from being watched
            /\.git/,         // Exclude .git files
            /\.vs/,          // Exclude .vs (Visual Studio) files
            /\.(db|log)$/    // Exclude certain extensions
        ]
    });

    watcher.on('change', async (filePath) => {
        watcherStatus = 'active';
        log('info', `File changed: ${filePath}`);

        if (!isIgnored(filePath, gitIgnorePatterns)) {
            isIdle = false;
            log('info', `Detected change in file: ${filePath}`);

            try {
                const changedFiles = await getGitDiff();
                log('info', `Files detected with changes: ${changedFiles.join(', ')}`);
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

    watcher.on('add', (filePath) => {
        watcherStatus = 'active';
        log('info', `File added: ${filePath}`);
    });

    watcher.on('unlink', (filePath) => {
        watcherStatus = 'active';
        log('info', `File removed: ${filePath}`);
    });

    watcher.on('ready', () => {
        log('info', 'Watcher is now active and monitoring the directory.');
        watcherStatus = 'active';
    });

    watcher.on('error', (error) => {
        log('error', `Watcher error: ${error.message}`);
        watcherStatus = 'error';
    });

    // Periodically log status when idle
    setInterval(() => {
        if (isIdle && !isStatusLogged) {
            log('info', `Status: [IDLE] (no tasks in progress, monitoring for changes).`);
            isStatusLogged = true;
        } else if (!isIdle) {
            isStatusLogged = false;
        }
    }, 300000); // 5-minute interval
};

// Startup message
log('info', `Starting monitoring tool...`);
monitorFiles();

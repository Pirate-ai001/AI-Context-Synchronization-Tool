import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { log } from './file_monitoring';  // Assuming log is in file_monitoring.js

// Path to store context snapshots
const contextSnapshotDir = path.resolve(__dirname, 'context_snapshots');

// Ensure the snapshots directory exists
if (!fs.existsSync(contextSnapshotDir)) {
    fs.mkdirSync(contextSnapshotDir);
}

// In-memory storage for versioned context snapshots
let contextSnapshots = [];

// Load existing context snapshots from disk
const loadContextSnapshots = () => {
    const snapshotFiles = fs.readdirSync(contextSnapshotDir);
    snapshotFiles.forEach(file => {
        const filePath = path.join(contextSnapshotDir, file);
        const snapshot = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        contextSnapshots.push(snapshot);
    });
};

// Generate a snapshot for the given file
const generateContextSnapshot = (changedFile) => {
    const snapshot = {
        timestamp: new Date().toISOString(),
        file: changedFile,
        content: fs.readFileSync(changedFile, 'utf8'),  // Get file content
    };
    contextSnapshots.push(snapshot);

    // Save the snapshot to disk
    const snapshotFilePath = path.join(contextSnapshotDir, `${Date.now()}.json`);
    fs.writeFileSync(snapshotFilePath, JSON.stringify(snapshot, null, 2));
    
    log('info', `Generated new context snapshot for ${changedFile}`);
};

// Watch relevant files for changes
const monitorContextFiles = () => {
    log('info', 'Initializing context monitoring...');
    loadContextSnapshots();  // Load existing snapshots at startup

    // Watch specific files for changes (e.g., code, config files)
    const watcher = chokidar.watch(path.resolve(__dirname, '..', 'src'), {
        persistent: true,
        ignored: /node_modules/,
    });

    watcher.on('change', (filePath) => {
        log('info', `File changed: ${filePath}`);
        generateContextSnapshot(filePath);  // Generate a snapshot on change
    });

    watcher.on('ready', () => {
        log('info', 'Context file monitoring initialized');
    });

    watcher.on('error', (error) => {
        log('error', `Error monitoring context files: ${error.message}`);
    });
};

// Initialize context monitoring service
monitorContextFiles();

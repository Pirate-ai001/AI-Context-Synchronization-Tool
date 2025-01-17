import chokidar from 'chokidar';
import chalk from 'chalk';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import JSON5 from 'json5';
import lodash from 'lodash';
import { exec } from 'child_process';

const { debounce } = lodash;
import { promisify } from 'util';

const execAsync = promisify(exec);

// Constants
const CONFIG = {
    DEBOUNCE_TIME: 300,
    STATUS_CHECK_INTERVAL: 300000,
    DEFAULT_IGNORED: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vs/**',
        '**/*.log',
        '**/dist/**',
        '**/build/**',
        '**/.cache/**'
    ]
};

class FileMonitor {
    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize core properties
            this.initializePaths();
            this.initializeState();
            
            // Load configurations
            await this.ensureConfigDirectory();
            await this.loadConfigurations();
            
            // Start monitoring
            await this.startMonitoring();
        } catch (error) {
            this.logError('Initialization failed', error);
            process.exit(1);
        }
    }

    initializePaths() {
        this.__dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
        this.configDir = path.join(this.__dirname, '..', 'Configuration');
        this.configPath = path.join(this.configDir, 'config.json5');
        this.gitignorePath = path.resolve(process.cwd(), '.gitignore');
    }

    initializeState() {
        this.isIdle = true;
        this.watcherStatus = 'idle';
        this.config = null;
        this.watcher = null;
        this.ignoredPatterns = new Set(CONFIG.DEFAULT_IGNORED);
    }

    // Logging Methods
    logInfo(message) {
        console.log(chalk.green(`[${new Date().toISOString()}] [INFO]: ${message}`));
    }

    logWarn(message) {
        console.log(chalk.yellow(`[${new Date().toISOString()}] [WARN]: ${message}`));
    }

    logError(message, error = null) {
        console.error(chalk.red(`[${new Date().toISOString()}] [ERROR]: ${message}`));
        if (error) {
            console.error(chalk.red('Details:', error.message));
            console.error(chalk.gray('Stack:', error.stack));
        }
    }

    logDebug(message) {
        if (this.config?.debugMode) {
            console.log(chalk.blue(`[${new Date().toISOString()}] [DEBUG]: ${message}`));
        }
    }

    // Configuration Management
    async ensureConfigDirectory() {
        if (!existsSync(this.configDir)) {
            await fs.mkdir(this.configDir, { recursive: true });
            this.logInfo(`Created configuration directory: ${this.configDir}`);
        }
    }

    async loadConfigurations() {
        await this.loadConfig();
        await this.loadGitignore();
    }

    async loadConfig() {
        const defaultConfig = {
            watchAllFiles: false,
            debugMode: false,
            debounceTime: CONFIG.DEBOUNCE_TIME,
            ignoredPatterns: CONFIG.DEFAULT_IGNORED,
            relationalMap: {},
            watchDirectories: ['./src/**/*']
        };

        try {
            if (!existsSync(this.configPath)) {
                await fs.writeFile(
                    this.configPath, 
                    JSON5.stringify(defaultConfig, null, 2)
                );
                this.logInfo('Created default configuration file');
            }

            const configContent = await fs.readFile(this.configPath, 'utf8');
            this.config = JSON5.parse(configContent);
            this.logInfo('Configuration loaded successfully');
        } catch (error) {
            this.logError('Failed to load configuration', error);
            this.config = defaultConfig;
        }
    }

    async loadGitignore() {
        try {
            if (existsSync(this.gitignorePath)) {
                const content = await fs.readFile(this.gitignorePath, 'utf8');
                const patterns = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith('#'));
                
                patterns.forEach(pattern => this.ignoredPatterns.add(pattern));
                this.logInfo(`Loaded ${patterns.length} patterns from .gitignore`);
            }
        } catch (error) {
            this.logWarn('Failed to load .gitignore patterns');
        }
    }

    // File Monitoring
    async startMonitoring() {
        const watchPaths = this.config.watchAllFiles 
            ? [path.join(process.cwd(), '**/*')]
            : this.config.watchDirectories;

        this.watcher = chokidar.watch(watchPaths, {
            ignored: Array.from(this.ignoredPatterns),
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            }
        });

        this.setupWatcherEvents();
        this.startIdleCheck();
        this.logInfo('File monitoring started');
    }

    setupWatcherEvents() {
        // Debounced change handler
        const handleChange = debounce(async (filePath) => {
            await this.handleFileChange(filePath);
        }, this.config.debounceTime);

        // Event listeners
        this.watcher
            .on('change', handleChange)
            .on('add', filePath => this.logInfo(`File added: ${filePath}`))
            .on('unlink', filePath => this.logInfo(`File removed: ${filePath}`))
            .on('error', error => this.logError('Watcher error', error));

        // Monitor config file changes
        const configWatcher = chokidar.watch(this.configPath);
        configWatcher.on('change', debounce(async () => {
            this.logInfo('Configuration file changed, reloading...');
            await this.loadConfigurations();
        }, CONFIG.DEBOUNCE_TIME));
    }

    async handleFileChange(filePath) {
        try {
            this.isIdle = false;
            const relativePath = path.relative(process.cwd(), filePath);
            this.logInfo(`File changed: ${relativePath}`);

            // Get Git changes
            const gitChanges = await this.getGitChanges();
            if (gitChanges.length > 0) {
                this.logInfo(`Git changes detected: ${gitChanges.join(', ')}`);
            }

            // Process related files
            const relatedFiles = this.findRelatedFiles(relativePath);
            if (relatedFiles.length > 0) {
                this.logInfo('Related files that may need attention:');
                relatedFiles.forEach(file => {
                    console.log(chalk.yellow(`  → ${file}`));
                });
            }

            this.isIdle = true;
        } catch (error) {
            this.logError('Error processing file change', error);
            this.isIdle = true;
        }
    }

    async getGitChanges() {
        try {
            const { stdout } = await execAsync('git diff --name-only');
            return stdout.split('\n').filter(Boolean);
        } catch (error) {
            this.logError('Failed to get git changes', error);
            return [];
        }
    }

    findRelatedFiles(changedFile) {
        const relatedFiles = new Set();
        const relationalMap = this.config.relationalMap;

        // Direct dependencies
        if (relationalMap[changedFile]) {
            relationalMap[changedFile].forEach(file => relatedFiles.add(file));
        }

        // Reverse dependencies (files that depend on the changed file)
        Object.entries(relationalMap).forEach(([source, targets]) => {
            targets.forEach(target => {
                if (this.matchesPattern(changedFile, target)) {
                    relatedFiles.add(source);
                }
            });
        });

        return Array.from(relatedFiles);
    }

    matchesPattern(filePath, pattern) {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(filePath);
        }
        return filePath === pattern;
    }

    startIdleCheck() {
        setInterval(() => {
            if (this.isIdle) {
                this.logDebug('System idle, monitoring for changes...');
            }
        }, CONFIG.STATUS_CHECK_INTERVAL);
    }
}

// Start the monitoring system
try {
    console.log(chalk.bold.cyan('Starting Context Sync Tool...'));
    new FileMonitor();
} catch (error) {
    console.error(chalk.red('Fatal error:', error.message));
    process.exit(1);
}
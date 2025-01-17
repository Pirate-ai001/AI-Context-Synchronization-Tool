import chokidar from 'chokidar';
import chalk from 'chalk';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import JSON5 from 'json5';
import lodash from 'lodash';
import { exec } from 'child_process';
import { promisify } from 'util';
import AIContextManager from './AIContextManager.js';

const execAsync = promisify(exec);
const { debounce } = lodash;

// Constants
const CONFIG = {
    DEBOUNCE_TIME: 300,
    IDLE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    DEFAULT_IGNORED: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vs/**',
        '**/*.log',
        '**/dist/**'
    ]
};

class FileMonitor {
    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadConfig();
            this.initializeState();
            this.aiContextManager = new AIContextManager(this.config, {
                info: (msg) => this.logInfo(msg),
                error: (msg, err) => this.logError(msg, err)
            });
            await this.startMonitoring();
            this.setupIdleTracking();
        } catch (error) {
            this.logError('Initialization failed', error);
            process.exit(1);
        }
    }

    initializeState() {
        this.isIdle = true;
        this.watcherStatus = 'idle';
    }

    // Logging methods
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
        }
    }

    logDebug(message) {
        if (this.config?.debugMode) {
            console.log(chalk.blue(`[${new Date().toISOString()}] [DEBUG]: ${message}`));
        }
    }

    async loadConfig() {
        try {
            const configPath = path.resolve('./Configuration/config.json5');
            const configContent = await fs.readFile(configPath, 'utf8');
            this.config = JSON5.parse(configContent);
            this.config = this.validateConfig(this.config);
        } catch (error) {
            this.logError('Failed to load configuration', error);
            this.config = this.getDefaultConfig();
        }
    }

    findRelatedFiles(changedFile) {
        const relationalMap = this.config.relationalMap || {};
        const relatedFiles = [];

        // Debug logging for related files tracking
        this.logDebug(`Tracking related files for: ${changedFile}`);

        // Check if the changed file is a key in the relational map
        if (relationalMap[changedFile]) {
            relatedFiles.push(...relationalMap[changedFile]);
            this.logDebug(`Direct match found for ${changedFile}: ${relatedFiles.join(', ')}`);
        }

        // Check for pattern-based matches
        for (const [key, dependencies] of Object.entries(relationalMap)) {
            // Use glob-like pattern matching
            if (key.includes('**') || key.includes('*')) {
                try {
                    const regex = new RegExp(key.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                    if (regex.test(changedFile)) {
                        relatedFiles.push(...dependencies);
                        this.logDebug(`Pattern match found for ${changedFile} using ${key}: ${dependencies.join(', ')}`);
                    }
                } catch (error) {
                    this.logError(`Error processing pattern ${key}`, error);
                }
            }
        }

        const uniqueRelatedFiles = [...new Set(relatedFiles)];
        this.logDebug(`Total unique related files: ${uniqueRelatedFiles.length}`);
        return uniqueRelatedFiles;
    }

    setupIdleTracking() {
        this.lastActivityTime = Date.now();
        this.idleCheckInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - this.lastActivityTime;
            if (timeSinceLastActivity >= CONFIG.IDLE_TIMEOUT) {
                this.logInfo('System has been idle for 5 minutes. Continuing to monitor for changes.');
            }
        }, CONFIG.IDLE_TIMEOUT);
    }

    async validateGitRepository(repoPath) {
        try {
            if (!existsSync(repoPath)) {
                throw new Error(`Repository path does not exist: ${repoPath}`);
            }

            const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', {
                cwd: repoPath
            });

            return stdout.trim() === 'true';
        } catch (error) {
            this.logError(`Invalid git repository: ${error.message}`);
            return false;
        }
    }

    async getGitChanges() {
        if (!this.config.gitConfig?.enabled) {
            this.logDebug('Git functionality is disabled');
            return [];
        }

        const repoPath = path.resolve(this.config.gitConfig.repositoryPath || process.cwd());
        
        try {
            const isValidRepo = await this.validateGitRepository(repoPath);
            if (!isValidRepo) {
                throw new Error('Invalid or unconfigured git repository');
            }

            const branch = this.config.gitConfig.branch || 'HEAD';
            const gitCommand = `git diff --name-only ${branch}`;
            const gitStatusCommand = 'git status --porcelain';
            
            const { stdout: diffOut } = await execAsync(gitCommand, { cwd: repoPath });
            const changes = diffOut.split('\n').filter(Boolean);
            
            const changeDetails = [];

            if (this.config.gitConfig.showGitStatus) {
                const { stdout: statusOut } = await execAsync(gitStatusCommand, { cwd: repoPath });
                const statusChanges = statusOut.split('\n').filter(Boolean);
                
                statusChanges.forEach(change => {
                    const [status, file] = change.trim().split(' ').filter(Boolean);
                    let statusText = '';
                    
                    switch(status) {
                        case 'M':
                            statusText = 'modified';
                            this.logInfo(`File ${chalk.yellow('modified')}: ${file}`);
                            break;
                        case 'A':
                            statusText = 'added';
                            this.logInfo(`File ${chalk.green('added')}: ${file}`);
                            break;
                        case 'D':
                            statusText = 'deleted';
                            this.logInfo(`File ${chalk.red('deleted')}: ${file}`);
                            break;
                        default:
                            statusText = 'unknown';
                            this.logInfo(`File ${chalk.gray('unknown status')}: ${file}`);
                    }
                    
                    changeDetails.push({ file, status: statusText });
                });
            }
            
            this.logInfo(`Git diff found ${changes.length} changes in repository`);
            
            // Update AI Context with changes
            if (this.config.aiOutputConfig?.enabled) {
                await this.aiContextManager.updateContext(changeDetails);
            }

            return changes;
        } catch (error) {
            this.logError('Failed to get git changes', error);
            return [];
        }
    }

    getDefaultConfig() {
        return {
            watchAllFiles: false,
            debugMode: false,
            debounceTime: CONFIG.DEBOUNCE_TIME,
            ignoredPatterns: CONFIG.DEFAULT_IGNORED,
            watchDirectories: ['./src/**/*'],
            gitConfig: {
                enabled: true,
                repositoryPath: process.cwd(),
                branch: 'main',
                showGitStatus: true
            },
            aiOutputConfig: {
                enabled: true,
                models: {
                    claude: {
                        enabled: true,
                        outputPath: "./AI_Context/claude/context.txt",
                        format: "markdown"
                    }
                },
                globalSettings: {
                    keepHistory: true,
                    historyPath: "./AI_Context/history",
                    maxHistoryFiles: 10
                }
            }
        };
    }

    validateConfig(config) {
        if (config.gitConfig?.enabled) {
            if (!config.gitConfig.repositoryPath) {
                this.logWarn('Git repository path not specified, using current directory');
            }
        }

        if (config.aiOutputConfig?.enabled) {
            if (!config.aiOutputConfig.models) {
                this.logWarn('No AI models configured, output will be disabled');
                config.aiOutputConfig.enabled = false;
            }
        }

        return config;
    }

    async startMonitoring() {
        const watchDirectories = this.config.watchDirectories || ['./src/**/*'];
        const ignoredPatterns = this.config.ignoredPatterns || CONFIG.DEFAULT_IGNORED;

        const debouncedHandleFileChange = debounce(
            this.handleFileChange.bind(this), 
            this.config.debounceTime || CONFIG.DEBOUNCE_TIME
        );

        try {
            const watcher = chokidar.watch(watchDirectories, {
                ignored: ignoredPatterns,
                persistent: true,
                ignoreInitial: true
            });

            watcher
                .on('change', (filePath) => {
                    this.logInfo(`File changed: ${filePath}`);
                    debouncedHandleFileChange(filePath);
                })
                .on('add', (filePath) => {
                    this.logInfo(`New file added: ${filePath}`);
                    debouncedHandleFileChange(filePath);
                })
                .on('unlink', (filePath) => {
                    this.logInfo(`File deleted: ${filePath}`);
                    debouncedHandleFileChange(filePath);
                });

            this.logInfo('File monitoring started');
        } catch (error) {
            this.logError('Failed to start file monitoring', error);
        }
    }

    async handleFileChange(filePath) {
        try {
            this.isIdle = false;
            this.lastActivityTime = Date.now(); // Update last activity time
            const relativePath = path.relative(process.cwd(), filePath);
            this.logInfo(`File changed: ${relativePath}`);

            let gitChanges = [];
            if (this.config.gitConfig?.enabled) {
                gitChanges = await this.getGitChanges();
                if (gitChanges.length > 0) {
                    this.logInfo('Git changes detected:');
                    gitChanges.forEach(change => {
                        console.log(chalk.yellow(`  → ${change}`));
                    });
                }
            }

            const relatedFiles = this.findRelatedFiles(relativePath);
            if (relatedFiles.length > 0) {
                this.logInfo('Related files that may need attention:');
                relatedFiles.forEach(file => {
                    console.log(chalk.blue(`  → ${file}`));
                });
            }

            // Update AI Context if enabled
            if (this.config.aiOutputConfig?.enabled) {
                await this.aiContextManager.createContextForModel('claude', gitChanges, relatedFiles);
            }

            this.isIdle = true;
        } catch (error) {
            this.logError('Error processing file change', error);
            this.isIdle = true;
        }
    }
}

// Instantiate and start the FileMonitor
const fileMonitor = new FileMonitor();
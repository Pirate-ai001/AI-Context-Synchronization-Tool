import chokidar from 'chokidar';
import chalk from 'chalk';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import JSON5 from 'json5';
import lodash from 'lodash';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const { debounce } = lodash;

class FileMonitor {
    constructor() {
        this.initialize();
    }

    // ... (previous initialization code remains the same)

    async validateGitRepository(repoPath) {
        try {
            // Check if path exists
            if (!existsSync(repoPath)) {
                throw new Error(`Repository path does not exist: ${repoPath}`);
            }

            // Check if it's a git repository
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
            // Validate repository before executing git commands
            const isValidRepo = await this.validateGitRepository(repoPath);
            if (!isValidRepo) {
                throw new Error('Invalid or unconfigured git repository');
            }

            // Construct git command based on configuration
            const branch = this.config.gitConfig.branch || 'HEAD';
            const gitCommand = `git diff --name-only ${branch}`;

            const gitCommand = `git diff --name-only ${branch}`;
            const gitStatusCommand = 'git status --porcelain';
            
            // Get diff changes
            const { stdout: diffOut } = await execAsync(gitCommand, { cwd: repoPath });
            const changes = diffOut.split('\n').filter(Boolean);
            
            // If status logging is enabled, get detailed status
            if (this.config.gitConfig.showGitStatus) {
                const { stdout: statusOut } = await execAsync(gitStatusCommand, { cwd: repoPath });
                const statusChanges = statusOut.split('\n').filter(Boolean);
                
                // Parse and log status changes
                statusChanges.forEach(change => {
                    const [status, file] = change.trim().split(' ').filter(Boolean);
                    let statusText = '';
                    
                    switch(status) {
                        case 'M':
                            statusText = chalk.yellow('modified');
                            break;
                        case 'A':
                            statusText = chalk.green('added');
                            break;
                        case 'D':
                            statusText = chalk.red('deleted');
                            break;
                        default:
                            statusText = chalk.gray('unknown status');
                    }
                    
                    this.logInfo(`File ${statusText}: ${file}`);
                });
            }
            
            this.logInfo(`Git diff found ${changes.length} changes in repository`);
            return changes;

        } catch (error) {
            this.logError('Failed to get git changes', error);
            return [];
        }
    }

    // Update the default configuration to include git settings
    getDefaultConfig() {
        return {
            watchAllFiles: false,
            debugMode: false,
            debounceTime: CONFIG.DEBOUNCE_TIME,
            ignoredPatterns: CONFIG.DEFAULT_IGNORED,
            watchDirectories: ['./src/**/*'],
            gitConfig: {
                enabled: true,
                repositoryPath: process.cwd(), // Default to current directory
                branch: 'main'                 // Default branch
            }
        };
    }

    // Add git configuration validation
    validateConfig(config) {
        if (config.gitConfig?.enabled) {
            if (!config.gitConfig.repositoryPath) {
                this.logWarn('Git repository path not specified, using current directory');
            }
        }
        return config;
    }

    // Update the file monitoring to include git status
    async handleFileChange(filePath) {
        try {
            this.isIdle = false;
            const relativePath = path.relative(process.cwd(), filePath);
            this.logInfo(`File changed: ${relativePath}`);

            // Get Git changes if enabled
            if (this.config.gitConfig?.enabled) {
                const gitChanges = await this.getGitChanges();
                if (gitChanges.length > 0) {
                    this.logInfo('Git changes detected:');
                    gitChanges.forEach(change => {
                        console.log(chalk.yellow(`  → ${change}`));
                    });
                }
            }

            // Process related files
            const relatedFiles = this.findRelatedFiles(relativePath);
            if (relatedFiles.length > 0) {
                this.logInfo('Related files that may need attention:');
                relatedFiles.forEach(file => {
                    console.log(chalk.blue(`  → ${file}`));
                });
            }

            this.isIdle = true;
        } catch (error) {
            this.logError('Error processing file change', error);
            this.isIdle = true;
        }
    }
}

// Export the class for use
export default FileMonitor;
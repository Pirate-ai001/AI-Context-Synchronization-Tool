import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

class AIContextManager {
    constructor(config, logger) {
        this.config = config.aiOutputConfig;
        this.logger = logger;
        this.initialize();
    }

    async initialize() {
        if (!this.config.enabled) return;
        
        try {
            await this.ensureDirectories();
        } catch (error) {
            this.logger.error('Failed to initialize AI context directories', error);
        }
    }

    async ensureDirectories() {
        if (!this.config.globalSettings.createMissingDirectories) return;

        // Create directories for each enabled model
        for (const [modelName, modelConfig] of Object.entries(this.config.models)) {
            if (modelConfig.enabled) {
                const outputDir = path.dirname(modelConfig.outputPath);
                if (!existsSync(outputDir)) {
                    mkdirSync(outputDir, { recursive: true });
                }
            }
        }

        // Create history directory if needed
        if (this.config.globalSettings.keepHistory) {
            const historyDir = this.config.globalSettings.historyPath;
            if (!existsSync(historyDir)) {
                mkdirSync(historyDir, { recursive: true });
            }
        }
    }

    createContextForModel(modelName, changes, relatedFiles) {
        const modelConfig = this.config.models[modelName];
        if (!modelConfig || !modelConfig.enabled) return;

        let context = '';
        if (modelConfig.format === 'markdown') {
            context = this.createMarkdownContext(modelConfig, changes, relatedFiles);
        } else if (modelConfig.format === 'json') {
            context = this.createJSONContext(modelConfig, changes, relatedFiles);
        }

        return this.writeContext(modelConfig.outputPath, context, modelName);
    }

    createMarkdownContext(modelConfig, changes, relatedFiles) {
        let context = modelConfig.headerTemplate + '\n\n';
        
        // Add changed files
        context += '### Changed Files\n';
        changes.forEach(change => {
            context += `- \`${change.file}\` (${change.status})\n`;
        });

        // Add related files if any
        if (relatedFiles && relatedFiles.length > 0) {
            context += '\n### Related Files\n';
            relatedFiles.forEach(file => {
                context += `- \`${file}\`\n`;
            });
        }

        return context;
    }

    createJSONContext(modelConfig, changes, relatedFiles) {
        const context = {
            timestamp: new Date().toISOString(),
            changes: changes.map(change => ({
                file: change.file,
                status: change.status
            })),
            relatedFiles: relatedFiles || []
        };

        return JSON.stringify(context, null, 2);
    }

    async writeContext(outputPath, content, modelName) {
        try {
            // Write current context
            await fs.writeFile(outputPath, content, 'utf8');
            this.logger.info(`Context written for ${modelName}`);

            // Save to history if enabled
            if (this.config.globalSettings.keepHistory) {
                await this.saveToHistory(content, modelName);
            }
        } catch (error) {
            this.logger.error(`Failed to write context for ${modelName}`, error);
        }
    }

    async saveToHistory(content, modelName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const historyPath = path.join(
                this.config.globalSettings.historyPath,
                `${modelName}_${timestamp}.txt`
            );

            await fs.writeFile(historyPath, content, 'utf8');
            await this.cleanupHistory(modelName);
        } catch (error) {
            this.logger.error('Failed to save context history', error);
        }
    }

    async cleanupHistory(modelName) {
        try {
            const historyDir = this.config.globalSettings.historyPath;
            const files = await fs.readdir(historyDir);
            
            // Filter files for specific model and sort by date
            const modelFiles = files
                .filter(file => file.startsWith(`${modelName}_`))
                .sort()
                .reverse();

            // Remove excess files
            const maxFiles = this.config.globalSettings.maxHistoryFiles;
            if (modelFiles.length > maxFiles) {
                const filesToRemove = modelFiles.slice(maxFiles);
                for (const file of filesToRemove) {
                    await fs.unlink(path.join(historyDir, file));
                }
            }
        } catch (error) {
            this.logger.error('Failed to cleanup history', error);
        }
    }
}

export default AIContextManager;
import fs from 'fs/promises';
import path from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';

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

        for (const [modelName, modelConfig] of Object.entries(this.config.models)) {
            if (modelConfig.enabled) {
                const outputDir = path.dirname(modelConfig.outputPath);
                if (!existsSync(outputDir)) {
                    mkdirSync(outputDir, { recursive: true });
                }
            }
        }

        if (this.config.globalSettings.keepHistory) {
            const historyDir = this.config.globalSettings.historyPath;
            if (!existsSync(historyDir)) {
                mkdirSync(historyDir, { recursive: true });
            }
        }
    }

    async getFileContent(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            this.logger.error(`Failed to read file: ${filePath}`, error);
            return null;
        }
    }

    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const typeMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown'
        };
        return typeMap[ext] || 'plaintext';
    }

    async analyzeChanges(changes) {
        const analyzedChanges = [];
        for (const change of changes) {
            const fileContent = await this.getFileContent(change.file);
            analyzedChanges.push({
                ...change,
                fileType: this.getFileType(change.file),
                fileContent: fileContent,
                modifiedElements: await this.analyzeModifiedElements(fileContent, this.getFileType(change.file))
            });
        }
        return analyzedChanges;
    }

    async analyzeModifiedElements(content, fileType) {
        // Basic implementation - can be enhanced with proper parsing
        const elements = [];
        if (!content) return elements;

        if (fileType === 'javascript' || fileType === 'typescript') {
            const functionRegex = /function\s+(\w+)|const\s+(\w+)\s*=/g;
            let match;
            while ((match = functionRegex.exec(content)) !== null) {
                elements.push({
                    name: match[1] || match[2],
                    purpose: 'Function/Component - Purpose needs manual documentation'
                });
            }
        }
        return elements;
    }

    async createContextForModel(modelName, changes, relatedFiles) {
        const modelConfig = this.config.models[modelName];
        if (!modelConfig || !modelConfig.enabled) return;

        const analyzedChanges = await this.analyzeChanges(changes);
        const analyzedRelatedFiles = await this.analyzeRelatedFiles(relatedFiles);

        let context = '';
        if (modelConfig.format === 'markdown') {
            context = await this.createMarkdownContext(modelConfig, analyzedChanges, analyzedRelatedFiles);
        } else if (modelConfig.format === 'json') {
            context = await this.createJSONContext(modelConfig, analyzedChanges, analyzedRelatedFiles);
        }

        return this.writeContext(modelConfig.outputPath, context, modelName);
    }

    async analyzeRelatedFiles(files) {
        if (!files) return [];
        
        const analyzedFiles = [];
        for (const file of files) {
            const content = await this.getFileContent(file);
            analyzedFiles.push({
                file,
                fileType: this.getFileType(file),
                relevantCode: content ? this.extractRelevantCode(content) : null,
                relationship: 'Dependency - Relationship needs manual documentation'
            });
        }
        return analyzedFiles;
    }

    extractRelevantCode(content) {
        // Basic implementation - can be enhanced with better code analysis
        const lines = content.split('\n');
        return lines.length > 20 ? lines.slice(0, 20).join('\n') + '\n// ... additional code' : content;
    }

    async createMarkdownContext(modelConfig, changes, relatedFiles) {
        const template = await this.getTemplate(modelConfig);
        return this.populateTemplate(template, {
            timestamp: new Date().toISOString(),
            branch: process.env.GIT_BRANCH || 'unknown',
            changes,
            relatedFiles,
            projectStructure: await this.getProjectStructure(),
            implementationNotes: 'Implementation details need to be documented',
            recentChanges: await this.getRecentChanges(),
            additionalNotes: 'Add any specific notes or context here'
        });
    }

    async getProjectStructure() {
        // Basic implementation - can be enhanced with more detailed structure
        return 'Project structure analysis needs to be implemented';
    }

    async getRecentChanges() {
        // Basic implementation - can be enhanced with git history
        return 'Recent changes history needs to be implemented';
    }

    populateTemplate(template, data) {
        // Basic template population - can be enhanced with a proper template engine
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(placeholder, JSON.stringify(value, null, 2));
        }
        return result;
    }

    async getTemplate(modelConfig) {
        const templatePath = path.join(path.dirname(modelConfig.outputPath), 'templates', 'default.md');
        try {
            return await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            this.logger.error(`Failed to read template: ${templatePath}`, error);
            return '# Error: Template not found';
        }
    }

    async writeContext(outputPath, content, modelName) {
        try {
            await fs.writeFile(outputPath, content, 'utf8');
            this.logger.info(`Context written for ${modelName}`);

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
            
            const modelFiles = files
                .filter(file => file.startsWith(`${modelName}_`))
                .sort()
                .reverse();

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
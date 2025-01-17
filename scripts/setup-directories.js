import fs from 'fs';
import path from 'path';

// Base directories structure
const directories = [
    './AI_Context',
    './AI_Context/claude',
    './AI_Context/claude/templates',
    './AI_Context/chatgpt',
    './AI_Context/chatgpt/templates',
    './AI_Context/history',
    './Configuration/templates'
];

// Create directories
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Template contents
const claudeTemplate = `# Project Update Context

## Recent Changes
The following files have been modified in the project:

### Changed Files
{{changes}}

### Related Files
These files might need attention based on their relationships:
{{relatedFiles}}

## Git Status
Current repository status:
{{gitStatus}}

## Additional Information
- Timestamp: {{timestamp}}
- Branch: {{branch}}
- Total Changes: {{totalChanges}}`;

const chatgptTemplate = `{
  "projectContext": {
    "timestamp": "{{timestamp}}",
    "branch": "{{branch}}",
    "changes": [
      {{#each changes}}
      {
        "file": "{{file}}",
        "status": "{{status}}",
        "type": "{{type}}"
      }
      {{/each}}
    ],
    "relatedFiles": [
      {{#each relatedFiles}}
      {
        "file": "{{file}}",
        "relationship": "{{relationship}}"
      }
      {{/each}}
    ],
    "gitStatus": {
      "addedFiles": {{addedCount}},
      "modifiedFiles": {{modifiedCount}},
      "deletedFiles": {{deletedCount}}
    }
  }
}`;

// Write template files
const templates = [
    {
        path: './AI_Context/claude/templates/default.md',
        content: claudeTemplate
    },
    {
        path: './AI_Context/chatgpt/templates/default.json',
        content: chatgptTemplate
    }
];

templates.forEach(template => {
    fs.writeFileSync(template.path, template.content);
    console.log(`Created template: ${template.path}`);
});

// Create .gitignore for AI_Context
const aiContextGitignore = `
# Ignore all files in history
history/*

# Don't ignore templates
!templates/
!templates/*

# Don't ignore .gitignore
!.gitignore

# Keep directory structure
!*/
`;

fs.writeFileSync('./AI_Context/.gitignore', aiContextGitignore.trim());
console.log('Created .gitignore for AI_Context');

console.log('\nSetup complete! Directory structure and templates are ready.');
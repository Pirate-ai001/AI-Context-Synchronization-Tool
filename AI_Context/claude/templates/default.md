# Project Context for Claude

## Current Development Context
{{timestamp}}
Branch: {{branch}}

## Recent Changes
{{#each changes}}
### File: `{{file}}`
```{{fileType}}
{{fileContent}}
```
**Change Type**: {{status}}
**Purpose**: {{purpose}}
**Key Functions/Components Modified**:
{{#each modifiedElements}}
- {{name}}: {{purpose}}
{{/each}}

## Related Files and Dependencies
{{#each relatedFiles}}
### `{{file}}`
**Relationship**: {{relationship}}
**Critical Functions Used**:
```{{fileType}}
{{relevantCode}}
```
{{/each}}

## Project Structure Context
{{projectStructure}}

## Current Implementation Notes
{{implementationNotes}}

## Development History Context
{{recentChanges}}

## Questions for Claude
1. Code Review: Please review these changes for potential issues or improvements
2. Implementation Advice: Any suggestions for better ways to implement these changes?
3. Documentation: What should be updated in the documentation based on these changes?
4. Testing: What test cases should be added for these changes?

## Additional Context
{{additionalNotes}}
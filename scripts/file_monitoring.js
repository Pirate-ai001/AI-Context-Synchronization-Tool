import chokidar from 'chokidar';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import JSON5 from 'json5';

// Normalize __dirname for Windows paths
const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');

// Resolve paths
const CONFIG_FILE_PATH = path.resolve(path.join(__dirname, '..', 'Configuration', 'config.json5'));
const GITIGNORE_PATH = path.resolve(process.cwd(), '.gitignore');

// Default configuration with comments
const defaultConfigContent = `// Configuration file
{
  "watchAllFiles": true, // Set to false to enable relational map mode
  "debounceTime": 100,  // Milliseconds to wait before processing changes
  "ignoredPatterns": [  // Patterns to ignore (in addition to .gitignore)
    "node_modules/**",
    "dist/**",
    ".git/**",
    "**/*.log"
  ],
  "relationalMap": {
    "src/components/sidebar.tsx": [
      "src/layout.tsx",
      "src/app.tsx",
      "tailwind.config.js"
    ],
    "tailwind.config.js": [
      "src/components/**/*.tsx"
    ]
  }
}`;

// Function to read .gitignore patterns
const getGitignorePatterns = () => {
  try {
    if (fs.existsSync(GITIGNORE_PATH)) {
      console.log(chalk.green('Found .gitignore file'));
      const gitignore = fs.readFileSync(GITIGNORE_PATH, 'utf-8')
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(pattern => pattern.trim());
      return gitignore;
    }
  } catch (err) {
    console.warn(chalk.yellow(`Warning: Could not read .gitignore: ${err.message}`));
  }
  return [];
};

// Ensure the Configuration directory exists
const configDir = path.join(__dirname, '..', 'Configuration');
if (!fs.existsSync(configDir)) {
  try {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(chalk.green(`Created missing directory: ${configDir}`));
  } catch (err) {
    console.error(chalk.red(`Failed to create Configuration directory: ${err.message}`));
    process.exit(1);
  }
}

// Check if the configuration file exists and create a default if missing
if (!fs.existsSync(CONFIG_FILE_PATH)) {
  console.log(chalk.yellow('Creating a default config.json5 file...'));
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, defaultConfigContent, 'utf-8');
    console.log(chalk.green('Default config.json5 file created successfully.'));
  } catch (err) {
    console.error(chalk.red(`Failed to create default configuration file: ${err.message}`));
    process.exit(1);
  }
}

// Function to read and parse the configuration file
const getConfig = () => {
  try {
    const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    return JSON5.parse(data);
  } catch (err) {
    console.error(chalk.red(`Failed to read or parse the configuration file: ${err.message}`));
    process.exit(1);
  }
};

// Function to normalize file paths for consistent matching
const normalizePath = (filePath) => {
  return path.normalize(filePath).replace(/\\/g, '/');
};

// Monitor file changes
const monitorFiles = () => {
  const config = getConfig();
  const watchAllFiles = config.watchAllFiles;
  const relationalMap = config.relationalMap;
  const debounceTime = config.debounceTime || 100;

  // Combine gitignore patterns with configured ignore patterns
  const gitignorePatterns = getGitignorePatterns();
  const ignoredPatterns = [
    ...gitignorePatterns,
    ...(config.ignoredPatterns || []),
    /(^|[\/\\])\../ // Ignore dot files
  ];

  let watchPaths;

  if (watchAllFiles) {
    watchPaths = [path.join(process.cwd(), '**/*')]; // Watch all files recursively
    console.log(chalk.cyan('Monitoring all files in the project directory.'));
  } else {
    // Normalize relational map paths
    const normalizedMap = Object.entries(relationalMap).reduce((acc, [key, value]) => {
      acc[normalizePath(key)] = value.map(normalizePath);
      return acc;
    }, {});

    watchPaths = Array.from(new Set([
      ...Object.keys(normalizedMap),
      ...Object.values(normalizedMap).flat()
    ])).map((p) => path.resolve(process.cwd(), p));

    console.log(chalk.cyan('Monitoring based on the relational map configuration.'));
  }

  const watcher = chokidar.watch(watchPaths, {
    persistent: true,
    ignoreInitial: true,
    ignored: ignoredPatterns
  });

  // Debounce handling
  let changeTimeout = null;
  const handleChange = (filePath) => {
    const normalizedPath = normalizePath(path.relative(process.cwd(), filePath));
    console.log(chalk.green(`File changed: ${normalizedPath}`));

    if (!watchAllFiles) {
      const relatedFiles = relationalMap[normalizedPath];

      if (relatedFiles && relatedFiles.length > 0) {
        console.log(chalk.blue('Related files that may need attention:'));
        relatedFiles.forEach((file) => {
          console.log(chalk.yellow(`  → ${file}`));
        });
      } else {
        const dependentFiles = Object.entries(relationalMap)
          .filter(([_, deps]) => deps.some(dep => {
            if (dep.includes('*')) {
              const pattern = new RegExp(dep.replace(/\*/g, '.*'));
              return pattern.test(normalizedPath);
            }
            return dep === normalizedPath;
          }))
          .map(([key]) => key);

        if (dependentFiles.length > 0) {
          console.log(chalk.blue('This file is referenced by:'));
          dependentFiles.forEach((file) => {
            console.log(chalk.yellow(`  ← ${file}`));
          });
        } else {
          console.log(chalk.gray('No related files found.'));
        }
      }
    }
  };

  watcher.on('change', (filePath) => {
    if (changeTimeout) {
      clearTimeout(changeTimeout);
    }
    changeTimeout = setTimeout(() => {
      handleChange(filePath);
    }, debounceTime);
  });

  watcher.on('ready', () => {
    console.log(chalk.bold('Monitoring file changes...'));
    console.log(chalk.gray(`Using ${ignoredPatterns.length} ignore patterns`));
  });

  console.log(chalk.bold('Initializing file monitoring...'));
};

// Monitor changes to the configuration file itself
const monitorConfigFile = () => {
  let configChangeTimeout = null;
  const watcher = chokidar.watch(CONFIG_FILE_PATH, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', () => {
    if (configChangeTimeout) {
      clearTimeout(configChangeTimeout);
    }
    configChangeTimeout = setTimeout(() => {
      console.log(chalk.magenta('Configuration file changed. Reloading...'));
      try {
        const updatedConfig = getConfig();
        console.log(chalk.green('Configuration successfully reloaded.'));
        console.log(chalk.cyan('Updated configuration:'), updatedConfig);
      } catch (err) {
        console.error(chalk.red(`Failed to reload configuration: ${err.message}`));
      }
    }, 100); // Small debounce for config changes
  });
};

// Start monitoring
try {
  console.log(chalk.cyan('Starting file monitoring system...'));
  monitorFiles();
  monitorConfigFile();
} catch (err) {
  console.error(chalk.red(`Fatal error: ${err.message}`));
  process.exit(1);
}
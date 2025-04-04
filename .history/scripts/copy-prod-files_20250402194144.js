const fs = require('fs-extra');
const path = require('path');

async function copyProductionFiles() {
  const sourceDir = path.join(__dirname, '..');
  const distDir = path.join(sourceDir, 'dist');

  try {
    // Ensure dist directory exists
    await fs.ensureDir(distDir);

    // Copy package.json and create a production version
    const packageJson = require('../package.json');
    const prodPackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      main: 'src/lambda.js', // Update the main entry point
      dependencies: packageJson.dependencies
    };
    await fs.writeJSON(path.join(distDir, 'package.json'), prodPackageJson, { spaces: 2 });

    // Install production dependencies
    console.log('Installing production dependencies...');
    const { execSync } = require('child_process');
    execSync('npm install --omit=dev --no-package-lock', { 
      cwd: distDir, 
      stdio: 'inherit'
    });

    console.log('Successfully prepared production build');
  } catch (err) {
    console.error('Error during production build:', err);
    process.exit(1);
  }
}

copyProductionFiles();

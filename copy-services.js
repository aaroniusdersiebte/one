// copy-services.js
const fs = require('fs-extra');
const path = require('path');

// Define paths
const srcServicesPath = path.join(__dirname, 'src', 'services');
const srcObsTemplatesPath = path.join(__dirname, 'src', 'obs-templates');
const destServicesPath = path.join(__dirname, 'build', 'services');
const destObsTemplatesPath = path.join(__dirname, 'build', 'obs-templates');

// Ensure destination directories exist
fs.ensureDirSync(destServicesPath);
fs.ensureDirSync(destObsTemplatesPath);

// Copy services
console.log(`Copying services from ${srcServicesPath} to ${destServicesPath}`);
fs.copySync(srcServicesPath, destServicesPath);

// Copy obs-templates
console.log(`Copying obs-templates from ${srcObsTemplatesPath} to ${destObsTemplatesPath}`);
fs.copySync(srcObsTemplatesPath, destObsTemplatesPath);

// Update electron.js to include the correct require statement
const electronJsPath = path.join(__dirname, 'build', 'electron.js');
const publicElectronJsPath = path.join(__dirname, 'public', 'electron.js');

// Copy public/electron.js to build/electron.js if it doesn't exist
if (!fs.existsSync(electronJsPath) && fs.existsSync(publicElectronJsPath)) {
  console.log(`Copying ${publicElectronJsPath} to ${electronJsPath}`);
  fs.copySync(publicElectronJsPath, electronJsPath);
}

console.log('All resources copied successfully!');
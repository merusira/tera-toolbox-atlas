// patch-manager.js
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class PatchManager extends EventEmitter {
    constructor(rootDir) {
        super();
        this.rootDir = rootDir;
        this.currentPatch = '34.04 Omni'; // Default to Patch 34
        this.moduleCache = new Map(); // Cache for loaded modules
    }

    // Get the appropriate folder path based on the current patch
    getPath(folderType) {
        if (this.currentPatch === '34.04 Omni') {
            // Use default folders for Patch 34
            return path.join(this.rootDir, folderType);
        } else if (this.currentPatch === '100.02 Starscape') {
            // Use patch100 folder for Patch 100
            return path.join(this.rootDir, 'patch100', folderType);
        } else {
            // Extract the patch number for other patches
            const patchNumber = this.currentPatch.split(' ')[0].split('.')[0];
            return path.join(this.rootDir, `patch${patchNumber}`, folderType);
        }
    }

    // Get the module list URL for the current patch
    getModuleListUrl() {
        if (this.currentPatch === '100.02 Starscape') {
            return 'https://raw.githubusercontent.com/merusira/moduleLists/master/moduleList-10002.json';
        } else {
            return 'https://raw.githubusercontent.com/merusira/moduleLists/master/moduleList-3104.json';
        }
    }

    // Clean up resources for a specific patch
    cleanupPatchResources(patchVersion) {
        // Determine the patch prefix
        let patchPrefix = '';
        if (patchVersion === '34.04 Omni') {
            patchPrefix = '';
        } else if (patchVersion === '100.02 Starscape') {
            patchPrefix = 'patch100';
        } else {
            // Extract the patch number
            const patchNumber = patchVersion.split(' ')[0].split('.')[0];
            patchPrefix = `patch${patchNumber}`;
        }
        
        // Clean up require cache for modules from this patch
        Object.keys(require.cache).forEach(modulePath => {
            if (modulePath.includes(path.join(this.rootDir, patchPrefix))) {
                delete require.cache[modulePath];
            }
        });
        
        // Run garbage collection if available
        if (global.gc) {
            global.gc();
        } else {
            console.warn('Garbage collection not available. Run with --expose-gc flag for better memory management.');
        }
    }

    // Switch to a different patch
    async switchPatch(newPatch, proxy) {
        if (this.currentPatch === newPatch) return;

        const oldPatch = this.currentPatch;
        this.currentPatch = newPatch;

        // Emit event to notify listeners about the patch change
        this.emit('patchChanging', oldPatch, newPatch);

        if (proxy) {
            // Unload all mods from the current connections
            await proxy.unloadAllMods();

            // Update data folder path
            proxy.dataFolder = this.getPath('data');

            // Update mod folder path
            proxy.modFolder = this.getPath('mods');

            // Update node_modules path in require paths
            const nodeModulesPath = this.getPath('node_modules');
            
            // Remove old node_modules path if it was added
            if (oldPatch !== '34.04 Omni') {
                // Extract the patch number for the old patch
                const oldPatchNumber = oldPatch.split(' ')[0].split('.')[0];
                const oldNodeModulesPath = path.join(this.rootDir, `patch${oldPatchNumber}`, 'node_modules');
                const index = module.paths.indexOf(oldNodeModulesPath);
                if (index !== -1) {
                    module.paths.splice(index, 1);
                }
                
                // Also check for nested paths that might have been created
                const nestedOldNodeModulesPath = path.join(this.rootDir, `patch${oldPatchNumber}`, `patch${oldPatchNumber}`, 'node_modules');
                const nestedIndex = module.paths.indexOf(nestedOldNodeModulesPath);
                if (nestedIndex !== -1) {
                    module.paths.splice(nestedIndex, 1);
                }
            }
            
            // Add new node_modules path if needed
            if (newPatch !== '34.04 Omni') {
                if (!module.paths.includes(nodeModulesPath)) {
                    module.paths.unshift(nodeModulesPath);
                }
            }

            // Clean up resources from the old patch
            this.cleanupPatchResources(oldPatch);

            // Reload all mods for the new patch
            await proxy.loadAllMods();
        }

        // Emit event to notify listeners that the patch has been changed
        this.emit('patchChanged', oldPatch, newPatch);
    }
}

module.exports = PatchManager;
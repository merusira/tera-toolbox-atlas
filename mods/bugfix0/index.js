class Bugfix {
    constructor(mod) {
        const fs = require('fs');
        const path = require('path');
        const submoduleRoot = path.join(mod.info.path, 'lib');

        // remove old submodule files
        try {
            const manifest = require('./manifest.json');
            const manifestFiles = Object.keys(manifest.files)
                .filter(submodule => submodule.includes('lib/'))
                .map(submodule => submodule.replace('lib/', ''));

            fs.readdirSync(submoduleRoot).forEach(submodule => {
                if (!manifestFiles.includes(submodule)) {
                    fs.unlinkSync(path.join(submoduleRoot, submodule));
                }
            });
        } catch (_) {}

        // load submodules
        this.submodules = fs.readdirSync(submoduleRoot).map(submodule => {
            const submoduleConstructor = require(path.join(submoduleRoot, submodule));
            return new submoduleConstructor(mod);
        });
    }

    destructor() {
        this.submodules.forEach(submodule => {
            if (typeof submodule.destructor === 'function')
                submodule.destructor();
        });

        delete this.submodules;
    }
}

exports.NetworkMod = Bugfix;

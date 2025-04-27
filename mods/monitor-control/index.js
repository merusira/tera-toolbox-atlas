const SettingsUI = require('tera-mod-ui').Settings;

module.exports = function Monitorcontrol(mod) {

    mod.command.add('block', (arg_1) => {
        if (arg_1 === 'scene') {
            mod.settings.blockscene = !mod.settings.blockscene;
            mod.command.message(`Blocking of cutscenes is now ${mod.settings.blockscene ? 'enabled' : 'disabled'}.`);
        }
        else if (arg_1 === 'zoom') {
            mod.settings.blockzoom = !mod.settings.blockzoom;
            mod.command.message(`Blocking of zoom scripts is now ${mod.settings.blockzoom ? 'enabled' : 'disabled'}.`);
        }
        else if (arg_1 === 'abnormal') {
            mod.settings.blockabnormality = !mod.settings.blockabnormality;
            mod.command.message(`Blocking screen abnormalities is now ${mod.settings.blockabnormality ? 'enabled' : 'disabled'}.`);
        }
        else if (arg_1 === 'crystal') {
            mod.settings.blockcrystal = !mod.settings.blockcrystal;
            mod.command.message(`Blocking crystal refresh messages is now ${mod.settings.blockcrystal ? 'enabled' : 'disabled'}.`);
        }
        else if (arg_1 === 'skill') {
            mod.settings.blockskill = !mod.settings.blockskill;
            mod.command.message(`Blocking skill refresh effects is now ${mod.settings.blockskill ? 'enabled' : 'disabled'}.`);
        }
        else if (arg_1 === 'config') {
            if (ui) {
                ui.show();
            }
        }
    });

    mod.hook('S_PLAY_MOVIE', 1, (event) => {
        if (mod.settings.blockscene) {
            mod.send('C_END_MOVIE', 1, Object.assign({unk: 1}, event));
            return false;
        }
    });

    mod.hook('S_START_ACTION_SCRIPT', 3, (event) => {
        if (mod.settings.asnoblock.includes(event.script)) return;
        if (mod.settings.blockzoom && event.script > 0) return false;
    });

    mod.hook('S_ABNORMALITY_BEGIN', 3, {order: 1000, filter: {fake: null}}, (event) => {
        if (mod.settings.blockabnormality && mod.settings.abnormalblock.includes(event.id)) return false;
    });

    mod.hook('S_ABNORMALITY_REFRESH', 1, (event) => {
        if (mod.settings.blockcrystal && mod.settings.crystalblock.includes(event.id)) return false;
        if (mod.settings.blockskill && mod.settings.skillblock.includes(event.id)) return false;
    });

    let ui = null;
    if (global.TeraProxy.GUIMode) {
        ui = new SettingsUI(mod, require('./settings_structure'), mod.settings, { height: 255 }, { alwaysOnTop: true });
        ui.on('update', settings => { mod.settings = settings; });

        this.destructor = () => {
            if (ui) {
                ui.close();
                ui = null;
            }
        };
    }
};

const DefaultSettings = {
    "blockzoom": true,
    "blockskill": false,
    "blockscene": true,
    "blockcrystal": true,
    "blockabnormality": true,
    "abnormalblock": [4850, 48732, 48734, 48735, 48736, 48737, 48738, 70251, 70252, 70253, 70254, 70255, 70256, 70465, 476806, 630201, 630202, 630411, 630511, 631002, 631003, 631201, 631202, 776017, 806001, 806002, 811061, 821101, 905656, 905657, 7102001, 45000011, 45000012, 47660800, 47660900, 47661000, 47662300, 999001011],
    "crystalblock": [10306, 10316, 12001, 12003, 12120, 12130],
    "skillblock": [101300, 101301],
    "asnoblock": [40000, 40001, 40002, 426002, 3107001, 3107002, 3107003, 3107005, 3107006, 3107007]
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) return { ...DefaultSettings, ...settings };
    else if (from_ver === null) return DefaultSettings;
    else {
        from_ver = Number(from_ver);
        to_ver = Number(to_ver);
        if (from_ver + 1 < to_ver) {
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }
        const oldsettings = settings;
        settings = Object.assign(DefaultSettings, {});
        switch (to_ver) {
            case 3:
                oldsettings["asnoblock"] = settings["asnoblock"];
                break;
        }
        for (const option in oldsettings) {
            if (settings[option] !== undefined) {
                settings[option] = oldsettings[option];
            }
        }
        return settings;
    }
};
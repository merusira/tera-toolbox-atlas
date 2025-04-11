/* eslint-disable guard-for-in */
const PACKET_DATA = {
    /* ABNORMALITY PACKETS */
    "S_ABNORMALITY_BEGIN": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 67,
            "version": 2
        },
        {
            "patch": 75,
            "version": 3
        },
        {
            "patch": 75, // just new format
            "version": 4
        },
        {
            "patch": 107,
            "version": 5
        }
    ],

    "S_ABNORMALITY_REFRESH": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 67,
            "version": 1
        },
        {
            "patch": 75, // just new format
            "version": 2
        }
    ],

    "S_ABNORMALITY_END": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 67,
            "version": 1
        }
    ],

    "S_HOLD_ABNORMALITY_ADD": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 67,
            "version": 2
        }
    ],

    "S_CLEAR_ALL_HOLDED_ABNORMALITY": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 67,
            "version": 1
        }
    ],

    /* ACTION PACKETS */

    "S_ACTION_STAGE": [
        {
            "patch": 29,
            "version": 9
        },
        {
            "patch": 67,
            "version": 6
        },
        {
            "patch": 74,
            "version": 7
        },
        {
            "patch": 75,
            "version": 8
        },
        {
            "patch": 75,
            "version": 9
        }
    ],

    "S_ACTION_END": [
        {
            "patch": 29,
            "version": 5
        },
        {
            "patch": 67,
            "version": 4
        },
        {
            "patch": 74,
            "version": 5
        }
    ],

    /* Glyph packets */

    "S_CREST_INFO": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 67,
            "version": 1
        },
        {
            "patch": 67,
            "version": 2
        }
    ],

    "S_CREST_APPLY": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 67,
            "version": 1
        },
        {
            "patch": 67,
            "version": 2
        }
    ],

    /* START SKILL PACKETS */

    "C_START_SKILL": [
        {
            "patch": 29,
            "version": 7
        },
        {
            "patch": 67,
            "version": 6
        },
        {
            "patch": 74,
            "version": 7
        }
    ],

    "C_START_TARGETED_SKILL": [
        {
            "patch": 29,
            "version": 6
        },
        {
            "patch": 67,
            "version": 5
        },
        {
            "patch": 74,
            "version": 6
        },
        {
            "patch": 74,
            "version": 7
        }
    ],

    "C_START_COMBO_INSTANT_SKILL": [
        {
            "patch": 29,
            "version": 5
        },
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 74,
            "version": 4
        },
        {
            "patch": 74,
            "version": 5
        },
        {
            "patch": 74,
            "version": 6
        }
    ],

    "C_START_INSTANCE_SKILL": [
        {
            "patch": 29,
            "version": 6
        },
        {
            "patch": 67,
            "version": 4
        },
        {
            "patch": 74,
            "version": 5
        },
        {
            "patch": 74,
            "version": 6
        },
        {
            "patch": 74,
            "version": 7
        },
        {
            "patch": 114,
            "version": 8
        }
    ],

    "C_START_INSTANCE_SKILL_EX": [
        {
            "patch": 67,
            "version": 4
        },
        {
            "patch": 74,
            "version": 5
        }
    ],

    "C_PRESS_SKILL": [
        {
            "patch": 29,
            "version": 4
        },
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 74,
            "version": 4
        },
        {
            "patch": 114,
            "version": 5
        }
    ],

    "C_NOTIMELINE_SKILL": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 67,
            "version": 2
        },
        {
            "patch": 74,
            "version": 3
        }
    ],

    /* MOVEMENT PACKETS */

    "C_PLAYER_LOCATION": [
        {
            "patch": 29,
            "version": 5
        },
        {
            "patch": 67,
            "version": 5
        }
    ],

    "C_NOTIFY_LOCATION_IN_ACTION": [
        {
            "patch": 29,
            "version": 4
        },
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 74,
            "version": 4
        }
    ],

    "C_NOTIFY_LOCATION_IN_DASH": [
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 74,
            "version": 4
        }
    ],

    /* Misc packets PACKETS */

    "S_LOGIN": [
        {
            "patch": 29,
            "version": 12
        },
        {
            "patch": 67,
            "version": 10
        },
        {
            "patch": 77,
            "version": 12
        },
        {
            "patch": 81,
            "version": 13
        },
        {
            "patch": 86,
            "version": 14
        },
        {
            "patch": 114,
            "version": 15
        }
    ],

    "S_CREATURE_LIFE": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 67,
            "version": 2
        },
        {
            "patch": 67,
            "version": 3
        }
    ],

    "S_DEAD_LOCATION": [
        {
            "patch": 92,
            "version": 2
        }
    ],

    "S_EACH_SKILL_RESULT": [
        {
            "patch": 29,
            "version": 13
        },
        {
            "patch": 67,
            "version": 10
        },
        {
            "patch": 74,
            "version": 12
        },
        {
            "patch": 75, // technically patch 74
            "version": 13
        },
        {
            "patch": 86,
            "version": 14
        },
        {
            "patch": 110,
            "version": 15
        }
    ],

    "S_LOAD_TOPO": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 67,
            "version": 3
        }
    ],

    "S_DESPAWN_USER": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 67,
            "version": 3
        }
    ],

    "S_SYSTEM_MESSAGE": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 67,
            "version": 1
        }
    ],

    "S_PARTY_MEMBER_STAT_UPDATE": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 108,
            "version": 4
        }
    ],

    "S_PARTY_MEMBER_CHANGE_HP": [
        {
            "patch": 29,
            "version": 4
        },
        {
            "patch": 92,
            "version": 4
        }
    ],

    "S_PARTY_MEMBER_CHANGE_MP": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 92,
            "version": 2
        }
    ],

    "S_BAN_PARTY_MEMBER": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 92,
            "version": 1
        }
    ],

    "S_LEAVE_PARTY_MEMBER": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 92,
            "version": 2
        }
    ],

    "S_LOGOUT_PARTY_MEMBER": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 60,
            "version": 1
        }
    ],

    "S_CHANGE_PARTY_MANAGER": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 60,
            "version": 2
        }
    ],

    "S_PLAYER_STAT_UPDATE": [
        {
            "patch": 29,
            "version": 11
        },
        {
            "patch": 67,
            "version": 8
        },
        {
            "patch": 75,
            "version": 10
        },
        {
            "patch": 75,
            "version": 11
        },
        {
            "patch": 80,
            "version": 12
        },
        {
            "patch": 86,
            "version": 13
        },
        {
            "patch": 93,
            "version": 14
        },
        {
            "patch": 105,
            "version": 15
        },
        {
            "patch": 106,
            "version": 16
        },
        {
            "patch": 108,
            "version": 17
        }
    ],

    "S_START_INVERSE_CAPTURE": [
        {
            "patch": 29,
            "version": 4
        },
        {
            "patch": 67,
            "version": 3
        },
        {
            "patch": 74,
            "version": 4
        }
    ],

    "S_CHANGE_RELATION": [
        {
            "patch": 29,
            "version": 1,
        }
    ],

    "S_SPAWN_USER": [
        {
            "patch": 29,
            "version": 13
        },
        {
            "patch": 80,
            "version": 15
        },
        {
            "patch": 99,
            "version": 16
        }
    ],

    "S_SPAWN_NPC": [
        {
            "patch": 29,
            "version": 11
        },
        {
            "patch": 80,
            "version": 11
        },
        {
            "patch": 101,
            "version": 12
        }
    ],

    "S_DESPAWN_NPC": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 80,
            "version": 3
        }
    ],

    "S_NPC_STATUS": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 60,
            "version": 1
        },
        {
            "patch": 79,
            "version": 2
        }
    ],

    "S_NPC_LOCATION": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 80,
            "version": 3
        }
    ],

    "S_USER_LOCATION": [
        {
            "patch": 29,
            "version": 5
        },
        {
            "patch": 80,
            "version": 5
        },
        {
            "patch": 105,
            "version": 6
        }
    ],

    "S_CREATURE_ROTATE": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 80,
            "version": 2
        }
    ],

    "S_USER_LEVELUP": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 80,
            "version": 2
        }
    ],

    "S_CURRENT_CHANNEL": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 80,
            "version": 2
        }
    ],

    "S_PLAYER_CHANGE_STAMINA": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 80,
            "version": 1
        }
    ],

    "S_CREATURE_CHANGE_HP": [
        {
            "patch": 29,
            "version": 6
        },
        {
            "patch": 80,
            "version": 6
        }
    ],

    "S_PLAYER_CHANGE_MP": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 80,
            "version": 1
        }
    ],

    "S_MOUNT_VEHICLE": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 80,
            "version": 2
        }
    ],

    "S_UNMOUNT_VEHICLE": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 80,
            "version": 2
        }
    ],

    "S_PARTY_MEMBER_LIST": [
        {
            "patch": 29,
            "version": 7
        },
        {
            "patch": 80,
            "version": 8
        },
        {
            "patch": 106,
            "version": 9
        }
    ],

    "S_ITEMLIST": [
        {
            "patch": 80,
            "version": 1
        },
        {
            "patch": 86,
            "version": 2
        },
        {
            "patch": 87,
            "version": 3
        },
        {
            "patch": 96,
            "version": 4
        },
        {
            "patch": 107,
            "version": 5
        },
        {
            "patch": 109,
            "version": 6
        },
        {
            "patch": 114,
            "version": 7
        }
    ],

    "C_CHECK_VERSION": [
        {
            "patch": 29,
            "version": 1
        },
        {
            "patch": 80,
            "version": 1
        }
    ],

    "S_USER_STATUS": [
        {
            "patch": 29,
            "version": 3
        },
        {
            "patch": 80,
            "version": 3
        },
        {
            "patch": 108,
            "version": 4
        }
    ],

    "S_GET_USER_LIST": [
        {
            "patch": 29,
            "version": 14
        },
        {
            "patch": 86,
            "version": 17
        },
        {
            "patch": 95,
            "version": 18
        },
        {
            "patch": 104,
            "version": 21
        }
    ],

    "S_SPAWN_COLLECTION": [
        {
            "patch": 29,
            "version": 4
        },
        {
            "patch": 92,
            "version": 4
        }
    ],

    "S_DESPAWN_COLLECTION": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 92,
            "version": 2
        }
    ],

    "S_BOSS_GAGE_INFO": [
        {
            "patch": 29,
            "version": 2
        },
        {
            "patch": 92,
            "version": 3
        }
    ]
};

class PacketHandler {
    constructor(dispatch) {
        this.dispatch = dispatch;
    }

    get(name, patchOverride) {
        const array = PACKET_DATA[name];
        if (!array) throw new Error(`PacketHandler looking for invalid packet name ${name}`);
        const patch = patchOverride || this.dispatch.majorPatchVersion;

        let version = null;
        for (let idx in array) {
            const obj = array[idx];
            if (patch >= obj.patch) version = obj.version;
        }

        return version;
    }

    get_all(name) {
        return [name, this.get(name)];
    }
}

module.exports = PacketHandler;

/* eslint-disable guard-for-in */
const DEFAULT_HOOK_SETTINGS = { order: -1000, filter: { fake: null } };

class entity {
    constructor(dispatch, mods) {
        this.mobs = {};
        this.players = {};
        this.npcs = {};
        this.collections = {};
        this.unknown = {};

        // Functions
        this.getLocationForThisEntity = (id) => {
            if (this.players[id]) return this.players[id].pos;
            if (this.mobs[id]) return this.mobs[id].pos;
            if (this.npcs[id]) return this.npcs[id].pos;
            if (this.collections[id]) return this.collections[id].pos;
            if (this.unknown[id]) return this.unknown[id].pos;
        };
        this.getLocationForPlayer = (id) => this.players[id].pos;
        this.getLocationForMob = (id) => this.mobs[id].pos;
        this.getLocationForNpc = (id) => this.npcs[id].pos;
        this.getLocationForCollection = (id) => this.collections[id].pos;

        // Pos is player position
        this.isNearEntity = (pos, playerRadius = 50, entityRadius = 50) => {
            if (this.isNearPlayer(pos, playerRadius, entityRadius)) return true;
            if (this.isNearBoss(pos, playerRadius, entityRadius)) return true;
            return false;
        };

        // Pos is player position
        this.isNearPlayer = (pos, playerRadius = 50, entityRadius = 50) => {
            for (let key in this.players) {
                let entity = this.players[key];
                if (mods.library.positionsIntersect(entity.pos, pos, playerRadius, entityRadius)) return true;
            }
            return false;
        };

        // Pos is player position
        this.isNearBoss = (pos, playerRadius = 50, entityRadius = 50) => {
            for (let key in this.mobs) {
                let entity = this.mobs[key];
                if (mods.library.positionsIntersect(entity.pos, pos, playerRadius, entityRadius)) return true;
            }
            return false;
        };

        this.getEntityData = (id) => this.npcs[id.toString()] || this.mobs[id.toString()] || this.players[id.toString()] || this.unknown[id.toString()];

        this.getSettingsForEntity = (id, object) => {
            const entity = this.getEntityData(id);

            if (object[entity.info.huntingZoneId]) {
                return object[entity.info.huntingZoneId][entity.info.templateId];
            }
        };

        // Zone reloaded -- reset cache
        this.resetCache = () => {
            this.mobs = {};
            this.players = {};
            this.npcs = {};
            this.collections = {};
            this.unknown = {};
        };
        dispatch.hook('S_LOAD_TOPO', 'raw', DEFAULT_HOOK_SETTINGS, this.resetCache);

        // Entity spawned
        this.spawnEntity = (mob, e) => {
            let id = e.gameId.toString();
            let job = (e.templateId - 10101) % 100;
            let race = Math.floor((e.templateId - 10101) / 100);

            let pos = e.loc;
            pos.w = e.w;

            let data = {
                name: e.name,
                info: {
                    huntingZoneId: e.huntingZoneId,
                    templateId: e.templateId
                },
                relation: e.relation,
                huntingZoneId: e.huntingZoneId,
                templateId: e.templateId,
                gameId: e.gameId,
                visible: e.visible,
                status: e.status,
                enraged: !!e.mode,
                loc: pos,
                job,
                race,
                pos
            };

            // hpLevel, 0: 0% <= hp < 20%, 1: 20% <= hp < 40%, 2: 40% <= hp < 60%, 3: 60% <= hp < 80%, 4: 80% <= hp < 100%, 5: 100% hp
            // relation(10 door), aggressive == isMob, relation(12 for special cases), rel = 10 & spawnType = 1 == HW dummy
            if (mob && e.villager) this.npcs[id] = Object.assign(data, { "var": "npcs" });
            else if (mob && (e.aggressive || e.relation == 12 || (e.relation == 10 && e.spawnType == 1))) this.mobs[id] = Object.assign(data, { "var": "mobs", hpLevel: 20 * e.hpLevel });
            else this.unknown[id] = Object.assign(data, { "var": "unknown" });
            if (!mob) this.players[id] = Object.assign(data, { "var": "players", serverId: e.serverId, playerId: e.playerId });
        };
        dispatch.hook(...mods.packet.get_all("S_SPAWN_USER"), DEFAULT_HOOK_SETTINGS, this.spawnEntity.bind(null, false));
        dispatch.hook(...mods.packet.get_all("S_SPAWN_NPC"), DEFAULT_HOOK_SETTINGS, this.spawnEntity.bind(null, true));

        // Entity despawned
        this.despawnEntity = (e) => {
            let id = e.gameId.toString();

            if (this.mobs[id]) delete this.mobs[id];
            if (this.npcs[id]) delete this.npcs[id];
            if (this.players[id]) delete this.players[id];
            if (this.unknown[id]) delete this.unknown[id];
        };
        dispatch.hook(...mods.packet.get_all("S_DESPAWN_NPC"), DEFAULT_HOOK_SETTINGS, this.despawnEntity);
        dispatch.hook(...mods.packet.get_all("S_DESPAWN_USER"), DEFAULT_HOOK_SETTINGS, this.despawnEntity);

        // Health update
        this.changeHp = e => {
            if (this.mobs[e.target]) this.mobs[e.target].hpLevel = Math.floor((Number(e.curHp) / Number(e.maxHp)) * 100);
        };
        dispatch.hook(...mods.packet.get_all("S_CREATURE_CHANGE_HP"), DEFAULT_HOOK_SETTINGS, this.changeHp);
        dispatch.hook(...mods.packet.get_all("S_BOSS_GAGE_INFO"), DEFAULT_HOOK_SETTINGS, this.changeHp);

        // Status update
        this.statusUpdate = e => {
            if (this.players[e.gameId]) this.players[e.gameId].status = e.status;
            if (this.mobs[e.gameId]) {
                this.mobs[e.gameId].status = e.status;
                this.mobs[e.gameId].enraged = e.enraged;
            }
            if (this.npcs[e.gameId]) {
                this.npcs[e.gameId].status = e.status;
                this.npcs[e.gameId].enraged = e.enraged;
            }
        };
        dispatch.hook(...mods.packet.get_all("S_NPC_STATUS"), DEFAULT_HOOK_SETTINGS, this.statusUpdate);
        dispatch.hook(...mods.packet.get_all("S_USER_STATUS"), DEFAULT_HOOK_SETTINGS, this.statusUpdate);

        // Move location update
        this.updatePosition = (mob, e) => {
            let id = e.gameId.toString();

            let pos = e.dest;
            pos.w = e.w;

            if (this.mobs[id]) this.mobs[id].pos = pos;
            if (this.players[id]) this.players[id].pos = pos;
            if (this.npcs[id]) this.npcs[id].pos = pos;
            if (this.unknown[id]) this.unknown[id].pos = pos;
        };
        dispatch.hook(...mods.packet.get_all("S_NPC_LOCATION"), DEFAULT_HOOK_SETTINGS, this.updatePosition.bind(null, true));
        dispatch.hook(...mods.packet.get_all("S_USER_LOCATION"), DEFAULT_HOOK_SETTINGS, this.updatePosition.bind(null, false));

        // Direction update
        this.directionUpdate = (e) => {
            let id = e.gameId.toString();
            if (this.mobs[id]) this.mobs[id].pos.w = e.w;
            if (this.players[id]) this.players[id].pos.w = e.w;
            if (this.npcs[id]) this.npcs[id].pos.w = e.w;
            if (this.unknown[id]) this.unknown[id].pos.w = e.w;
        };
        dispatch.hook(...mods.packet.get_all("S_CREATURE_ROTATE"), DEFAULT_HOOK_SETTINGS, this.directionUpdate);

        // Entity CC'ed -- update location
        dispatch.hook(...mods.packet.get_all("S_EACH_SKILL_RESULT"), DEFAULT_HOOK_SETTINGS, e => {
            let id = e.target.toString();
            let loc = null;

            if (this.npcs[id]) loc = this.npcs[id].pos;
            if (this.mobs[id]) loc = this.mobs[id].pos;
            if (this.players[id]) loc = this.players[id].pos;
            if (this.unknown[id]) loc = this.unknown[id].pos;

            if (loc) {
                if (e.reaction.enable) {
                    let dist = 0;
                    for (let i in e.reaction.animSeq) dist += e.reaction.animSeq[i].distance;
                    dist *= -1;
                    mods.library.applyDistance(loc, dist);
                }
            }
        });


        // S_ACTION_STAGE / END location update
        // Make this update position "live" later on
        this.sAction = (e) => {
            let id = e.gameId.toString();

            let pos = e.loc;
            pos.w = e.w;

            if (e.movement) {
                let distance = 0;
                for (let idx in e.movement) {
                    distance += e.movement[idx].distance;
                }
                mods.library.applyDistance(pos, distance);
            }

            if (e.animSeq) {
                let distance = 0;
                for (let idx in e.animSeq) {
                    distance += e.animSeq[idx].distance;
                }
                mods.library.applyDistance(pos, distance);
            }

            if (this.mobs[id]) this.mobs[id].pos = pos;
            if (this.players[id]) this.players[id].pos = pos;
            if (this.npcs[id]) this.npcs[id].pos = pos;
            if (this.unknown[id]) this.unknown[id].pos = pos;
        };
        dispatch.hook(...mods.packet.get_all("S_ACTION_STAGE"), DEFAULT_HOOK_SETTINGS, this.sAction);
        dispatch.hook(...mods.packet.get_all("S_ACTION_END"), DEFAULT_HOOK_SETTINGS, this.sAction);

        // Collection spawned
        this.spawnCollection = (e) => {
            let id = e.gameId.toString();

            let pos = e.loc;
            pos.w = e.w;

            let data = {
                gameId: e.gameId,
                id: e.id,
                amount: e.amount,
                loc: pos,
                pos,
                extractor: e.extractor,
                extractorDisabled: e.extractorDisabled,
                extractorDisabledTime: e.extractorDisabledTime
            };

            this.collections[id] = Object.assign(data, { "var": "collections" });
        };
        dispatch.hook(...mods.packet.get_all("S_SPAWN_COLLECTION"), DEFAULT_HOOK_SETTINGS, this.spawnCollection);

        // Collection despawned
        this.despawnCollection = (e) => {
            let id = e.gameId.toString();

            if (this.collections[id]) delete this.collections[id];
        };
        dispatch.hook(...mods.packet.get_all("S_DESPAWN_COLLECTION"), DEFAULT_HOOK_SETTINGS, this.despawnCollection);

        // Mob hp got updated
        dispatch.hook(...mods.packet.get_all("S_CREATURE_CHANGE_HP"), DEFAULT_HOOK_SETTINGS, e => {
            let id = e.target.toString();

            const data = {
                curHp: e.curHp,
                maxHp: e.maxHp
            };

            if (this.mobs[id]) Object.assign(this.mobs[id], data);
            if (this.players[id]) Object.assign(this.players[id], data);
            if (this.npcs[id]) Object.assign(this.npcs[id], data);
            if (this.unknown[id]) Object.assign(this.unknown[id], data);
        });

        // Relation got updated
        dispatch.hook(...mods.packet.get_all("S_CHANGE_RELATION"), DEFAULT_HOOK_SETTINGS, e => {
            let id = e.target.toString();

            if (this.mobs[id]) this.mobs[id].relation = e.relation;
            if (this.players[id]) this.players[id].relation = e.relation;
            if (this.npcs[id]) this.npcs[id].relation = e.relation;
            if (this.unknown[id]) this.unknown[id].relation = e.relation;
        });
    }
}

module.exports = entity;

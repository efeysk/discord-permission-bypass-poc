(function() {
    'use strict';
    
    try {
        let _mods;
        try {
            _mods = webpackChunkdiscord_app.push([[Symbol()], {}, r => r.c]);
            webpackChunkdiscord_app.pop();
        } catch (e) {
            console.warn("Webpack chunk erişimi başarısız:", e);
            return;
        }

        const findByProps = (...props) => {
            for (let m of Object.values(_mods)) {
                try {
                    if (!m?.exports || m.exports === window) continue;
                    
                    if (props.every(x => m.exports?.[x])) {
                        return m.exports;
                    }
                    
                    for (let ex in m.exports) {
                        if (props.every(x => m.exports?.[ex]?.[x]) && 
                            m.exports[ex]?.[Symbol.toStringTag] !== 'IntlMessagesProxy') {
                            return m.exports[ex];
                        }
                    }
                } catch {}
            }
            return null;
        };

        const PermissionStore = findByProps("can", "canBasicChannel");
        const UserStore = findByProps("getCurrentUser", "getUserStoreVersion");
        const GuildStore = findByProps("getGuild", "getGuilds");
        
        if (!PermissionStore || !UserStore || !GuildStore) {
            console.warn("Gerekli store'lar bulunamadı");
            return;
        }

        const originalFunctions = {
            can: PermissionStore.can,
            canBasicChannel: PermissionStore.canBasicChannel,
            canAccessGuildSettings: PermissionStore.canAccessGuildSettings,
            canManageUser: PermissionStore.canManageUser
        };

        const safeOverride = (obj, funcName, newFunc) => {
            try {
                const descriptor = Object.getOwnPropertyDescriptor(obj, funcName) || 
                                 Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), funcName);
                
                if (descriptor && descriptor.configurable !== false) {
                    Object.defineProperty(obj, funcName, {
                        value: newFunc,
                        writable: true,
                        configurable: true,
                        enumerable: descriptor.enumerable || false
                    });
                    return true;
                }
            } catch (e) {
                console.warn(`${funcName} override başarısız:`, e);
            }
            return false;
        };

        const permissionOverrides = {
            can: () => true,
            canBasicChannel: () => true,
            canAccessGuildSettings: () => true,
            canAccessMemberSafetyPage: () => true,
            canManageUser: () => true,
            canWithPartialContext: () => true,
            isRoleHigher: () => true
        };

        Object.entries(permissionOverrides).forEach(([funcName, newFunc]) => {
            if (PermissionStore[funcName]) {
                safeOverride(PermissionStore, funcName, newFunc);
            }
        });

        const guilds = GuildStore.getGuilds();
        if (guilds && Object.keys(guilds).length > 0) {
            const currentUserId = UserStore.getCurrentUser()?.id;
            
            Object.values(guilds).forEach(guild => {
                if (guild && typeof guild === 'object') {
                    try {
                        safeOverride(guild, 'isOwner', function(id) {
                            return id === currentUserId || id === this.ownerId;
                        });
                        
                        safeOverride(guild, 'isOwnerWithRequiredMfaLevel', function(id) {
                            return id === currentUserId || id === this.ownerId;
                        });
                    } catch (e) {
                        console.warn("Guild override hatası:", e);
                    }
                }
            });
        }

        window.herseyiTemizle = () => {
            try {
                Object.entries(originalFunctions).forEach(([funcName, originalFunc]) => {
                    if (originalFunc && PermissionStore[funcName]) {
                        PermissionStore[funcName] = originalFunc;
                    }
                });
                console.log("Permission overrides temizlendi");
            } catch (e) {
                console.warn("Temizleme hatası:", e);
            }
        };

        console.log("[DİKKAT] Araç başarıyla çalıştırılldı.");
        console.log("TEMİZLEMEK İÇİN: herseyiTemizle()");
        console.log("TÜM SORUMLULUK KULLANICIYA AİTTİR.")

    } catch (error) {
        console.error("Genel hata:", error);
    }
})();

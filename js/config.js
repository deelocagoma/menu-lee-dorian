// Configuration JSONBin.io
const JSONBIN_CONFIG = {
    masterKey: '$2a$10$q94z0iyNLwf.aYQIH.DWvu0rTWEIbvKOl4Wl/Ufoe/Ugu21V2EcPC',
    accessKey: '$2a$10$Noao9RAZSt9fuJ.tlTGUWuop0KGzd77DmqZiTNHZgGQiAHZGgSdTq',
    binId: null // Sera créé automatiquement au premier lancement
};

// URL de base de l'application
const APP_URL = window.location.origin + window.location.pathname.replace(/\/admin\/.*$/, '/').replace(/\/index\.html$/, '/');

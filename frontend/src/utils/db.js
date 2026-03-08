import Dexie from 'dexie';

export const db = new Dexie('PontoDatabase');

db.version(1).stores({
    pontos_pendentes: '++id, user_id, tipo, horario_dispositivo, latitude, longitude, is_offline'
});

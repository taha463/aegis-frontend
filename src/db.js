import Dexie from "dexie";

export const db = new Dexie("AegisOfflineDB");
db.version(2).stores({
  // Increment version to 2
  shelters: "id, name, lat, lng",
  safePoints: "id, name, lat, lng",
  sosQueue: "++id, lat, lng, timestamp, status", // 🟢 Add this line
});

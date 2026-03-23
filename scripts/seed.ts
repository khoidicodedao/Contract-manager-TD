import { initializeDatabase } from "../server/database";

(async () => {
    try {
        console.log("Starting manual seed...");
        await initializeDatabase();
        console.log("Manual seed completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
})();

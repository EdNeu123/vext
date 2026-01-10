import { getDatabase } from "../../config/database";
import * as db from "../../db";

/**
 * Seed database with initial data
 */
export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create admin user
    await db.upsertUser({
      openId: "admin-001",
      name: "Admin Vext",
      email: "admin@vext.com.br",
      role: "admin",
      loginMethod: "manus",
    });

    console.log("✅ Admin user created");

    // Create sample tags
    const tags = [
      { name: "Hot Lead", color: "#ef4444" },
      { name: "Cold Lead", color: "#3b82f6" },
      { name: "Enterprise", color: "#8b5cf6" },
      { name: "SMB", color: "#10b981" },
      { name: "Follow-up", color: "#f59e0b" },
    ];

    for (const tag of tags) {
      await db.createTag(tag);
    }

    console.log("✅ Sample tags created");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

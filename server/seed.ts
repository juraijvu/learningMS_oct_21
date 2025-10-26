import { db } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import 'dotenv/config';
async function seed() {
  console.log("Starting database seeding...");

  // Create demo users
  const demoUsers = [
    {
      username: "admin",
      password: "admin123",
      email: "admin@lms.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin" as const,
    },
    {
      username: "trainer1",
      password: "trainer123",
      email: "trainer1@lms.com",
      firstName: "John",
      lastName: "Trainer",
      role: "trainer" as const,
    },
    {
      username: "sales1",
      password: "sales123",
      email: "sales1@lms.com",
      firstName: "Jane",
      lastName: "Sales",
      role: "sales_consultant" as const,
    },
    {
      username: "student1",
      password: "student123",
      email: "student1@lms.com",
      firstName: "Mike",
      lastName: "Student",
      role: "student" as const,
    },
  ];

  for (const userData of demoUsers) {
    const { password, ...userInfo } = userData;
    const passwordHash = await hashPassword(password);

    try {
      await db.insert(users).values({
        ...userInfo,
        passwordHash,
      });
      console.log(`✓ Created user: ${userData.username} (${userData.role})`);
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`- User ${userData.username} already exists, skipping...`);
      } else {
        console.error(`Error creating user ${userData.username}:`, error);
      }
    }
  }

  console.log("\nSeeding completed!");
  console.log("\nDemo credentials:");
  console.log("Admin: admin / admin123");
  console.log("Trainer: trainer1 / trainer123");
  console.log("Sales: sales1 / sales123");
  console.log("Student: student1 / student123");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

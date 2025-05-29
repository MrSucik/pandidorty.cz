import { db } from "../app/db";
import { users } from "../app/db/schema";
import { hashPassword } from "../app/utils/auth.server";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function seedAdmin() {
  const email = "admin@pandidorty.cz";
  const password = "xxx";
  
  console.log("Creating admin user...");
  
  try {
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Insert the user
    const result = await db.insert(users).values({
      email,
      name: "Admin User",
      password: hashedPassword,
      isActive: true,
    }).onConflictDoNothing();
    
    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
  
  process.exit(0);
}

seedAdmin(); 
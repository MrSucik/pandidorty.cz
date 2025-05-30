import dotenv from "dotenv";
import { db } from "../app/db";
import { users } from "../app/db/schema";
import { hashPassword } from "../app/utils/auth.server";

// Load environment variables
dotenv.config();

async function seedAdmin() {
	const email = process.env.ADMIN_EMAIL || "admin@pandidorty.cz";
	const password = process.env.ADMIN_PASSWORD;

	// Check if password is provided
	if (!password) {
		console.error("❌ Error: ADMIN_PASSWORD environment variable is required!");
		console.log("\n💡 Usage:");
		console.log("   ADMIN_PASSWORD=your_secure_password npm run seed:admin");
		console.log("\n   Or add ADMIN_PASSWORD to your .env file");
		process.exit(1);
	}

	// Validate password strength
	if (password.length < 8) {
		console.error("❌ Error: Password must be at least 8 characters long!");
		process.exit(1);
	}

	console.log("Creating admin user...");
	console.log(`📧 Email: ${email}`);

	try {
		// Hash the password
		const hashedPassword = await hashPassword(password);

		// Insert the user
		const result = await db
			.insert(users)
			.values({
				email,
				name: "Admin User",
				password: hashedPassword,
				isActive: true,
			})
			.onConflictDoNothing()
			.returning({ id: users.id, email: users.email });

		if (result.length > 0) {
			console.log("✅ Admin user created successfully!");
			console.log(`👤 User ID: ${result[0].id}`);
		} else {
			console.log("ℹ️  Admin user already exists, skipping creation.");
		}

		console.log("\n⚠️  IMPORTANT: Keep your admin credentials secure!");
	} catch (error) {
		console.error("❌ Error creating admin user:", error);
		process.exit(1);
	}

	process.exit(0);
}

seedAdmin();

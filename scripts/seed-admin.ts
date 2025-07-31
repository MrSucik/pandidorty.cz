import dotenv from "dotenv";
import { eq } from "drizzle-orm";
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

		// Check if user exists
		const existingUser = await db
			.select({ id: users.id, email: users.email })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existingUser.length > 0) {
			// Update password for existing user
			await db
				.update(users)
				.set({ password: hashedPassword })
				.where(eq(users.email, email));

			console.log("✅ Admin user password updated successfully!");
			console.log(`👤 User ID: ${existingUser[0].id}`);
		} else {
			// Insert new user
			const result = await db
				.insert(users)
				.values({
					email,
					name: "Admin User",
					password: hashedPassword,
					isActive: true,
				})
				.returning({ id: users.id, email: users.email });

			console.log("✅ Admin user created successfully!");
			console.log(`👤 User ID: ${result[0].id}`);
		}

		console.log("\n⚠️  IMPORTANT: Keep your admin credentials secure!");
	} catch (error) {
		console.error("❌ Error creating admin user:", error);
		process.exit(1);
	}

	process.exit(0);
}

seedAdmin();

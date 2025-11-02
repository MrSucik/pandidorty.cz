import { expect, test } from "@playwright/test";

test.describe("Admin Login", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/admin/login");
	});

	test("should display login form", async ({ page }) => {
		// Check page title
		await expect(
			page.getByRole("heading", { name: "Admin Login" }),
		).toBeVisible();

		// Check form fields
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
	});

	test("should show error for invalid credentials", async ({ page }) => {
		// Fill in invalid credentials
		await page.locator('input[name="email"]').fill("invalid@example.com");
		await page.locator('input[name="password"]').fill("wrongpassword");

		// Submit form
		await page.getByRole("button", { name: "Sign in" }).click();

		// Check for error message - wait for it to appear
		await page.waitForSelector(".bg-red-50", { timeout: 5000 });
		await expect(page.locator(".bg-red-50")).toBeVisible();
		// The actual error message might vary
		const errorText = await page.locator(".bg-red-50").textContent();
		expect(errorText).toBeTruthy();
	});

	test("should show validation errors for empty fields", async ({ page }) => {
		// Click submit without filling fields
		await page.getByRole("button", { name: "Sign in" }).click();

		// Should stay on login page
		await expect(page).toHaveURL(/\/admin\/login/);

		// Check for HTML5 validation (required fields)
		const emailInput = page.locator('input[name="email"]');
		const emailValidity = await emailInput.evaluate(
			(el: HTMLInputElement) => el.validity.valueMissing,
		);
		expect(emailValidity).toBeTruthy();
	});

	test.skip("should redirect to admin dashboard on successful login", async ({
		page,
	}) => {
		// Skip this test as it requires real credentials or proper mocking
		// This would need to be tested with a test database or test user
	});

	test("should handle network errors gracefully", async ({ page }) => {
		// Mock network failure
		await page.route("/admin/login", async (route) => {
			if (route.request().method() === "POST") {
				await route.abort("failed");
			} else {
				await route.continue();
			}
		});

		// Fill in credentials
		await page.locator('input[name="email"]').fill("admin@example.com");
		await page.locator('input[name="password"]').fill("password");

		// Submit form
		await page.getByRole("button", { name: "Sign in" }).click();

		// Should show error message
		await expect(page.locator(".bg-red-50, .text-red-600")).toBeVisible({
			timeout: 10000,
		});
	});

	test("should navigate to login from admin pages when not authenticated", async ({
		page,
	}) => {
		// Try to access admin dashboard directly
		await page.goto("/admin");

		// Should redirect to login
		await expect(page).toHaveURL(/\/admin\/login/);
		await expect(
			page.getByRole("heading", { name: "Admin Login" }),
		).toBeVisible();
	});

	test("should handle logout correctly", async ({ page, context }) => {
		// First, mock a successful login
		await context.addCookies([
			{
				name: "session",
				value: "test-session",
				domain: "localhost",
				path: "/",
			},
		]);

		// Mock the admin page to accept our session
		await page.route("/admin", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "text/html",
				body: `
					<!DOCTYPE html>
					<html>
						<body>
							<h1>Administrace</h1>
							<a href="/admin/logout">Logout</a>
						</body>
					</html>
				`,
			});
		});

		// Mock logout endpoint
		await page.route("/admin/logout", async (route) => {
			await route.fulfill({
				status: 302,
				headers: {
					Location: "/admin/login",
					"Set-Cookie":
						"session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
				},
			});
		});

		// Go to admin dashboard
		await page.goto("/admin");

		// Click logout
		await page.getByRole("link", { name: "Logout" }).click();

		// Should redirect to login
		await expect(page).toHaveURL(/\/admin\/login/);
	});

	test.skip("should persist session across page refreshes", async ({
		page,
		context,
	}) => {
		// Skip this test as it requires real authentication
		// This would need to be tested with a test database or test user
	});
});

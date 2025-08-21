import { expect, test } from "@playwright/test";

test("smoke test - app loads", async ({ page }) => {
	await page.goto("/");

	// Check navigation links exist (use first to avoid strict mode violation)
	await expect(
		page.getByRole("link", { name: /Dorty/i }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Objednávka/i }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: /Galerie/i }).first(),
	).toBeVisible();
});

test("smoke test - order form loads", async ({ page }) => {
	await page.goto("/objednavka");

	// Wait for the form to load
	await expect(page.getByRole("heading", { name: "Objednávka" })).toBeVisible();

	// Check critical form elements
	await expect(page.locator("#name")).toBeVisible();
	await expect(page.locator("#email")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Odeslat objednávku/i }),
	).toBeVisible();
});

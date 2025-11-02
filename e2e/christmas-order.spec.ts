import { expect, test } from "@playwright/test";

test.describe("Christmas Tasting Order Flow", () => {
	test("should navigate to Christmas order form from homepage", async ({
		page,
	}) => {
		await page.goto("/");

		// Check that Christmas order link exists
		const christmasLink = page.getByRole("link", {
			name: /Vánoční cukroví/i,
		});
		await expect(christmasLink).toBeVisible();

		// Click and navigate to Christmas order page
		await christmasLink.click();
		await expect(page).toHaveURL("/vanocni-cukrovi");
		await expect(page.locator("h1")).toContainText("Vánoční Cukroví");
	});

	test("should display form with required fields", async ({ page }) => {
		await page.goto("/vanocni-cukrovi");

		// Verify form elements are present
		await expect(page.locator("#name")).toBeVisible();
		await expect(page.locator("#email")).toBeVisible();
		await expect(page.locator("#phone")).toBeVisible();
		await expect(page.locator("#date")).toBeVisible();
		await expect(page.locator("#cakeBoxQty")).toBeVisible();
		await expect(page.locator("#sweetbarBoxQty")).toBeVisible();
	});

	test("should validate at least one box is selected", async ({ page }) => {
		await page.goto("/vanocni-cukrovi");

		// Fill contact info but leave quantities at 0
		await page.fill("#name", "Test User");
		await page.fill("#email", "test@example.com");
		await page.fill("#phone", "777123456");

		// Set a valid date (4 days from now)
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 4);
		const dateString = futureDate.toISOString().split("T")[0];
		await page.fill("#date", dateString);

		// Try to submit
		await page.click('button[type="submit"]');

		// Should show error about selecting at least one box
		await expect(page.locator("text=/alespoň jednu/i")).toBeVisible({
			timeout: 5000,
		});
	});

	test("should calculate total amount correctly", async ({ page }) => {
		await page.goto("/vanocni-cukrovi");

		// Set quantities
		await page.fill("#cakeBoxQty", "2");
		await page.fill("#sweetbarBoxQty", "1");

		// Total should be 2*450 + 1*350 = 1250 Kč
		await expect(page.locator("text=/1250 Kč/i")).toBeVisible({
			timeout: 3000,
		});
	});

	test("should submit order successfully with mocked API", async ({ page }) => {
		// Mock the submit endpoint
		await page.route("/api/submit-christmas-order", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					message: "Objednávka vánočního cukroví byla úspěšně odeslána!",
					orderId: "XMAS-test-123",
					orderDetails: {
						id: 1,
						orderNumber: "XMAS-test-123",
						customerName: "Test User",
						deliveryDate: new Date(),
						cakeBoxQty: 1,
						sweetbarBoxQty: 1,
						totalAmount: 800,
					},
				}),
			});
		});

		await page.goto("/vanocni-cukrovi");

		// Fill form
		await page.fill("#name", "Test User");
		await page.fill("#email", "test@example.com");
		await page.fill("#phone", "777123456");

		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 4);
		const dateString = futureDate.toISOString().split("T")[0];
		await page.fill("#date", dateString);

		await page.fill("#cakeBoxQty", "1");
		await page.fill("#sweetbarBoxQty", "1");

		// Submit
		await page.click('button[type="submit"]');

		// Wait for success message
		await expect(page.locator("text=/úspěšně odeslána/i").first()).toBeVisible({
			timeout: 10000,
		});

		// Verify order number is displayed
		await expect(page.locator("text=/XMAS-test-123/i")).toBeVisible();

		// Verify payment instructions are shown
		await expect(page.locator("text=/800 Kč/i")).toBeVisible();
	});

	test("should validate minimum date (3 days from now)", async ({ page }) => {
		await page.goto("/vanocni-cukrovi");

		// Fill contact info
		await page.fill("#name", "Test User");
		await page.fill("#email", "test@example.com");
		await page.fill("#phone", "777123456");
		await page.fill("#cakeBoxQty", "1");

		// Set a date only 2 days from now (should fail)
		const tooSoonDate = new Date();
		tooSoonDate.setDate(tooSoonDate.getDate() + 2);
		const dateString = tooSoonDate.toISOString().split("T")[0];
		await page.fill("#date", dateString);

		// Try to submit
		await page.click('button[type="submit"]');

		// Should show error about minimum date
		await expect(page.locator("text=/alespoň 3 dny od dnes/i")).toBeVisible({
			timeout: 5000,
		});
	});

	test("should handle API errors gracefully", async ({ page }) => {
		// Mock the submit endpoint to return error
		await page.route("/api/submit-christmas-order", async (route) => {
			await route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({
					success: false,
					error: "Testovací chyba",
				}),
			});
		});

		await page.goto("/vanocni-cukrovi");

		// Fill form
		await page.fill("#name", "Test User");
		await page.fill("#email", "test@example.com");
		await page.fill("#phone", "777123456");

		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 4);
		const dateString = futureDate.toISOString().split("T")[0];
		await page.fill("#date", dateString);

		await page.fill("#cakeBoxQty", "1");

		// Submit
		await page.click('button[type="submit"]');

		// Should show error message
		await expect(page.locator("text=/Testovací chyba/i")).toBeVisible({
			timeout: 5000,
		});
	});
});

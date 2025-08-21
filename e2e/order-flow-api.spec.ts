import { expect, test } from "@playwright/test";
import { testCakes, testCustomers, testDesserts } from "./fixtures/test-data";

test.describe("Order API Integration", () => {
	test.describe("API Response Handling", () => {
		test("should handle successful order submission with all fields", async ({
			page,
			request,
		}) => {
			// Create a mock server response
			await page.route("/api/submit-order", async (route) => {
				// Check request headers and body
				const headers = route.request().headers();
				const postData = route.request().postData();
				
				// Verify it's a form submission
				expect(headers['content-type']).toContain('multipart/form-data');
				expect(postData).toBeTruthy();

				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						success: true,
						message: "Objednávka byla úspěšně odeslána!",
						orderId: `test-${Date.now()}`,
					}),
				});
			});

			await page.goto("/objednavka");

			// Fill and submit form
			await page.fill("#name", testCustomers.validCustomer.name);
			await page.fill("#email", testCustomers.validCustomer.email);
			await page.fill("#phone", testCustomers.validCustomer.phone);

			// Select a valid date
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dort");
			await page.fill("#size", testCakes.medium.size);
			await page.fill("#flavor", testCakes.medium.flavor);
			await page.fill("#message", testCakes.medium.message);

			await page.click('button:has-text("Odeslat objednávku")');

			// Verify success
			await expect(page.locator("h2.text-green-600")).toBeVisible();
		});

		test("should handle API timeout gracefully", async ({ page }) => {
			await page.route("/api/submit-order", async (route) => {
				// Simulate timeout by not responding
				await new Promise((resolve) => setTimeout(resolve, 35000));
				await route.fulfill({
					status: 408,
					contentType: "application/json",
					body: JSON.stringify({
						success: false,
						error: "Request timeout",
					}),
				});
			});

			await page.goto("/objednavka");

			// Fill minimal form
			await page.fill("#name", testCustomers.validCustomer.name);
			await page.fill("#email", testCustomers.validCustomer.email);
			await page.fill("#phone", testCustomers.validCustomer.phone);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dort");
			await page.fill("#size", "20");
			await page.fill("#flavor", "Test");

			// Set a shorter timeout for the test
			await page.click('button:has-text("Odeslat objednávku")');

			// Should show loading state
			await expect(page.locator("text=Odesílám...")).toBeVisible();
		});

		test("should handle malformed API responses", async ({ page }) => {
			await page.route("/api/submit-order", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "text/html", // Wrong content type
					body: "<html>Not JSON</html>",
				});
			});

			await page.goto("/objednavka");

			// Fill form
			await page.fill("#name", testCustomers.validCustomer.name);
			await page.fill("#email", testCustomers.validCustomer.email);
			await page.fill("#phone", testCustomers.validCustomer.phone);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dezert");
			await page.fill("#dessertChoice", testDesserts.small);

			await page.click('button:has-text("Odeslat objednávku")');

			// Should show error
			const errorMessage = page.locator(".bg-red-50.text-red-600");
			await expect(errorMessage).toBeVisible();
		});

		test("should handle rate limiting (429 response)", async ({ page }) => {
			await page.route("/api/submit-order", async (route) => {
				await route.fulfill({
					status: 429,
					contentType: "application/json",
					body: JSON.stringify({
						success: false,
						error: "Příliš mnoho požadavků. Zkuste to prosím za chvíli.",
					}),
				});
			});

			await page.goto("/objednavka");

			// Fill form
			await page.fill("#name", testCustomers.corporateCustomer.name);
			await page.fill("#email", testCustomers.corporateCustomer.email);
			await page.fill("#phone", testCustomers.corporateCustomer.phone);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dort");
			await page.check("text=Dezert");
			await page.fill("#size", testCakes.large.size);
			await page.fill("#flavor", testCakes.large.flavor);
			await page.fill("#dessertChoice", testDesserts.large);

			await page.click('button:has-text("Odeslat objednávku")');

			// Should show rate limit error
			const errorMessage = page.locator(".bg-red-50.text-red-600");
			await expect(errorMessage).toBeVisible();
			await expect(errorMessage).toContainText("Příliš mnoho požadavků");
		});

		test("should retry on network failure", async ({ page }) => {
			let attemptCount = 0;

			await page.route("/api/submit-order", async (route) => {
				attemptCount++;

				if (attemptCount === 1) {
					// First attempt fails
					await route.abort("failed");
				} else {
					// Second attempt succeeds
					await route.fulfill({
						status: 200,
						contentType: "application/json",
						body: JSON.stringify({
							success: true,
							message: "Objednávka byla úspěšně odeslána!",
							orderId: "retry-success-123",
						}),
					});
				}
			});

			await page.goto("/objednavka");

			// Fill form
			await page.fill("#name", testCustomers.validCustomer.name);
			await page.fill("#email", testCustomers.validCustomer.email);
			await page.fill("#phone", testCustomers.validCustomer.phone);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dort");
			await page.fill("#size", "15");
			await page.fill("#flavor", "Máslový");

			// First submission will fail
			await page.click('button:has-text("Odeslat objednávku")');

			// Wait for error
			const errorMessage = page.locator(".bg-red-50.text-red-600");
			await expect(errorMessage).toBeVisible();

			// Try again
			await page.click('button:has-text("Odeslat objednávku")');

			// Should succeed on retry
			await expect(page.locator("h2.text-green-600")).toBeVisible({
				timeout: 10000,
			});
		});
	});

	test.describe("FormData Validation", () => {
		test("should send correct FormData structure", async ({ page }) => {
			let capturedPostData: string | null = null;

			await page.route("/api/submit-order", async (route) => {
				// Capture the post data
				capturedPostData = route.request().postData();
				const headers = route.request().headers();
				
				// Verify it's multipart form data
				expect(headers['content-type']).toContain('multipart/form-data');
				expect(capturedPostData).toContain('name="name"');
				expect(capturedPostData).toContain('name="email"');
				expect(capturedPostData).toContain('name="phone"');

				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						success: true,
						message: "Objednávka byla úspěšně odeslána!",
					}),
				});
			});

			await page.goto("/objednavka");

			// Fill complete form
			await page.fill("#name", testCustomers.validCustomer.name);
			await page.fill("#email", testCustomers.validCustomer.email);
			await page.fill("#phone", testCustomers.validCustomer.phone);

			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 14);
			while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
				futureDate.setDate(futureDate.getDate() + 1);
			}
			await page.fill("#date", futureDate.toISOString().split("T")[0]);

			await page.check("text=Dort");
			await page.check("text=Dezert");
			await page.fill("#size", testCakes.custom.size);
			await page.fill("#flavor", testCakes.custom.flavor);
			await page.fill("#message", testCakes.custom.message);
			await page.fill("#dessertChoice", testDesserts.custom);

			// Add photo
			const buffer = Buffer.from("test image content");
			await page
				.locator("#photos")
				.setInputFiles([{ name: "test.jpg", mimeType: "image/jpeg", buffer }]);

			await page.click('button:has-text("Odeslat objednávku")');

			// Wait for success
			await expect(page.locator("h2.text-green-600")).toBeVisible();

			// Verify data was captured
			expect(capturedPostData).toBeTruthy();
			expect(capturedPostData).toContain(testCustomers.validCustomer.name);
			expect(capturedPostData).toContain(testCustomers.validCustomer.email);
			expect(capturedPostData).toContain(testCakes.custom.size);
			expect(capturedPostData).toContain(testCakes.custom.flavor);
		});
	});
});

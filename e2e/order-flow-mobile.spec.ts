import { devices, expect, test } from "@playwright/test";
import { testCakes, testCustomers, testDesserts } from "./fixtures/test-data";
import { OrderFormPage } from "./page-objects/OrderFormPage";

test.use({
	...devices["iPhone 13"],
});

test.describe("Order Flow - Mobile", () => {
	let orderFormPage: OrderFormPage;

	test.beforeEach(async ({ page }) => {
		orderFormPage = new OrderFormPage(page);
		await orderFormPage.goto();
	});

	test("should be responsive on mobile devices", async ({ page }) => {
		await expect(
			page.getByRole("heading", { name: "Objednávka" }),
		).toBeVisible();

		// Check that form elements are properly stacked on mobile
		const viewport = page.viewportSize();
		expect(viewport?.width).toBeLessThan(768);

		// Verify all form elements are accessible
		await expect(orderFormPage.nameInput).toBeInViewport();
		await page.evaluate(() => window.scrollBy(0, 200));
		await expect(orderFormPage.emailInput).toBeInViewport();
		await page.evaluate(() => window.scrollBy(0, 200));
		await expect(orderFormPage.phoneInput).toBeInViewport();
	});

	test("should handle touch interactions for checkboxes", async ({ page }) => {
		// Mock successful API response
		await page.route("/api/submit-order", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					message: "Objednávka byla úspěšně odeslána!",
				}),
			});
		});

		// Test checkbox interactions on mobile
		await orderFormPage.orderCakeCheckbox.check();
		await expect(orderFormPage.orderCakeCheckbox).toBeChecked();

		await orderFormPage.orderDessertCheckbox.check();
		await expect(orderFormPage.orderDessertCheckbox).toBeChecked();

		// Fill form on mobile
		await orderFormPage.fillContactInfo(
			testCustomers.validCustomer.name,
			testCustomers.validCustomer.email,
			testCustomers.validCustomer.phone,
		);

		await orderFormPage.selectValidDeliveryDate();

		// Scroll to cake details
		await page.evaluate(() => window.scrollBy(0, 300));
		await orderFormPage.fillCakeDetails(
			testCakes.small.size,
			testCakes.small.flavor,
		);

		// Scroll to dessert details
		await page.evaluate(() => window.scrollBy(0, 200));
		await orderFormPage.fillDessertDetails(testDesserts.small);

		// Scroll to submit button
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await orderFormPage.submitButton.click();

		await orderFormPage.verifySuccessMessage();
	});

	test("should handle date picker on mobile", async ({ page }) => {
		// Mobile date inputs might behave differently
		const dateInput = orderFormPage.dateInput;
		await dateInput.click();

		// Fill date using mobile-friendly approach
		await orderFormPage.selectValidDeliveryDate();

		const dateValue = await dateInput.inputValue();
		expect(dateValue).toBeTruthy();
		expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("should handle file upload on mobile", async ({ page }) => {
		await page.route("/api/submit-order", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					message: "Objednávka byla úspěšně odeslána!",
				}),
			});
		});

		await orderFormPage.fillContactInfo(
			testCustomers.validCustomer.name,
			testCustomers.validCustomer.email,
			testCustomers.validCustomer.phone,
		);

		await orderFormPage.selectValidDeliveryDate();
		await orderFormPage.orderCakeCheckbox.check();

		// Scroll to cake details
		await page.evaluate(() => window.scrollBy(0, 400));
		await orderFormPage.fillCakeDetails(
			testCakes.medium.size,
			testCakes.medium.flavor,
		);

		// Test file upload on mobile
		const buffer = Buffer.from("fake mobile image content");
		await page
			.locator("#photos")
			.setInputFiles([
				{ name: "mobile-photo.jpg", mimeType: "image/jpeg", buffer },
			]);

		// Scroll to submit
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await orderFormPage.submitButton.click();

		await orderFormPage.verifySuccessMessage();
	});

	test("should display validation errors appropriately on mobile", async ({
		page,
	}) => {
		// Submit empty form
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await orderFormPage.submitButton.click();

		// Scroll back to top to see errors
		await page.evaluate(() => window.scrollTo(0, 0));

		const errorMessage = page.locator("text=Toto pole je povinné").first();
		await expect(errorMessage).toBeVisible();
		await expect(errorMessage).toBeInViewport();
	});
});

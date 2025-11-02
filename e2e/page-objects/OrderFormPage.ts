import { expect, type Locator, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";

export class OrderFormPage {
	readonly page: Page;
	readonly nameInput: Locator;
	readonly emailInput: Locator;
	readonly phoneInput: Locator;
	readonly dateInput: Locator;
	readonly orderCakeCheckbox: Locator;
	readonly orderDessertCheckbox: Locator;
	readonly sizeInput: Locator;
	readonly flavorInput: Locator;
	readonly dessertChoiceTextarea: Locator;
	readonly messageTextarea: Locator;
	readonly submitButton: Locator;
	readonly successMessage: Locator;
	readonly errorMessage: Locator;
	readonly formLevelError: Locator;

	constructor(page: Page) {
		this.page = page;
		this.nameInput = page.locator("#name");
		this.emailInput = page.locator("#email");
		this.phoneInput = page.locator("#phone");
		this.dateInput = page.locator("#date");
		this.orderCakeCheckbox = page.locator(
			'input[type="checkbox"][name="orderCake"]',
		);
		this.orderDessertCheckbox = page.locator(
			'input[type="checkbox"][name="orderDessert"]',
		);
		this.sizeInput = page.locator("#size");
		this.flavorInput = page.locator("#flavor");
		this.dessertChoiceTextarea = page.locator("#dessertChoice");
		this.messageTextarea = page.locator("#message");
		this.submitButton = page.getByRole("button", {
			name: /Odeslat objednávku/i,
		});
		this.successMessage = page.locator("h2.text-green-600");
		this.errorMessage = page.locator(".text-red-600");
		this.formLevelError = page.locator(".bg-red-50.text-red-600");
	}

	async goto() {
		await this.page.goto("/objednavka");
		await this.page.waitForLoadState("networkidle");
		await this.nameInput.waitFor({ state: "visible" });
	}

	async fillContactInfo(name: string, email: string, phone: string) {
		await this.nameInput.fill(name);
		await this.emailInput.fill(email);
		await this.phoneInput.fill(phone);
	}

	async selectValidDeliveryDate() {
		// Pick a date 10 days from now and adjust to Thursday-Saturday
		let futureDate = addDays(new Date(), 10);
		while (futureDate.getDay() < 4 || futureDate.getDay() === 0) {
			futureDate = addDays(futureDate, 1);
		}
		await this.dateInput.fill(format(futureDate, "yyyy-MM-dd"));
	}

	async selectOrderType(cake: boolean, dessert: boolean) {
		if (cake) {
			await this.orderCakeCheckbox.check();
		} else {
			await this.orderCakeCheckbox.uncheck();
		}

		if (dessert) {
			await this.orderDessertCheckbox.check();
		} else {
			await this.orderDessertCheckbox.uncheck();
		}
	}

	async fillCakeDetails(size: string, flavor: string, message?: string) {
		await this.sizeInput.fill(size);
		await this.flavorInput.fill(flavor);
		if (message) {
			await this.messageTextarea.fill(message);
		}
	}

	async fillDessertDetails(dessertChoice: string) {
		await this.dessertChoiceTextarea.fill(dessertChoice);
	}

	async submitForm() {
		await this.submitButton.click();
	}

	async submitOrderWithCake(
		name: string,
		email: string,
		phone: string,
		size: string,
		flavor: string,
		message?: string,
	) {
		await this.fillContactInfo(name, email, phone);
		await this.selectValidDeliveryDate();
		await this.selectOrderType(true, false);
		await this.fillCakeDetails(size, flavor, message);
		await this.submitForm();
	}

	async submitOrderWithDessert(
		name: string,
		email: string,
		phone: string,
		dessertChoice: string,
	) {
		await this.fillContactInfo(name, email, phone);
		await this.selectValidDeliveryDate();
		await this.selectOrderType(false, true);
		await this.fillDessertDetails(dessertChoice);
		await this.submitForm();
	}

	async submitOrderWithBoth(
		name: string,
		email: string,
		phone: string,
		size: string,
		flavor: string,
		dessertChoice: string,
		message?: string,
	) {
		await this.fillContactInfo(name, email, phone);
		await this.selectValidDeliveryDate();
		await this.selectOrderType(true, true);
		await this.fillCakeDetails(size, flavor, message);
		await this.fillDessertDetails(dessertChoice);
		await this.submitForm();
	}

	async verifySuccessMessage() {
		await expect(this.successMessage).toBeVisible({ timeout: 10000 });
		await expect(this.successMessage).toContainText(
			/Objednávka byla úspěšně odeslána/i,
		);
	}

	async verifyCakeFieldsVisible() {
		// Check if the cake section container is visible
		const cakeSection = this.page.locator(".bg-pink-50\\/50").first();
		await expect(cakeSection).toBeVisible();
		// Also check individual fields
		await expect(this.sizeInput).toBeVisible();
		await expect(this.flavorInput).toBeVisible();
	}
}

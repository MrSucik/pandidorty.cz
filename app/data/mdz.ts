export const MDZ_DATA = {
	products: {
		withFlowers: {
			name: "Zákusky + kytice od Nedbalek",
			price: 430,
		},
		dessertsOnly: {
			name: "Pouze zákusky",
			price: 170,
		},
	},
	boxContents: [
		"XXL tartaletka s karamelizovanou bílou čokoládou a marakujou",
		"čokoládový větrník s mandlovo-malinovým krémem",
	],
	payment: {
		deposit: 170,
		description:
			"Objednávka je platná po uhrazení zálohy 170 Kč.",
		qrCodePath: "/payments/mdz-qr.jpg",
	},
	pickup: [
		{
			label: "Poruba u Pandy",
			location: "Pod Nemocnicí 2026/65",
			time: "10:00–11:00",
		},
		{
			label: "centrum u Nedbalek",
			time: "11:30–12:00",
		},
	],
	pickupDate: "v neděli 8.3.",
	pickupNote: "Po domluvě zvládneme i sobotu.",
	orderDeadline: "do čtvrtka 5.3.2026",
} as const;

export type MdzData = typeof MDZ_DATA;

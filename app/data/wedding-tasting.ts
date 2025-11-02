export const WEDDING_TASTING_DATA = {
	cakeBox: {
		name: "Ochutnávka dortů",
		price: 550,
		description: "Krabička obsahuje 6 nejoblíbenějších příchutí",
		items: [
			"vanilkový korpus, vanilkový krém + rozvar z lesního ovoce",
			"čokoládový korpus, čokoládový krém + maliny",
			"red velvet korpus, vanilkový krém + maliny",
			"čokoládový korpus, krém kokos & bílá čokoláda",
			"vanilkový korpus, pistáciový krém + mango&marakuja curd a maliny",
			"čokoládový korpus, karamelový krém + jahody a karamel",
		],
		maxOrders: 15, // Note: This is informational only. Actual capacity is app-wide (15 total orders)
	},
	sweetbarBox: {
		name: "Ochutnávka sweetbaru",
		price: 750,
		description: "Krabička obsahuje 14 nejoblíbenějších zákusků",
		items: [
			"karamelový mini větrníček",
			"malinová a karamelová makronka",
			"pistáciová a čokoládovo-karamelová tartaletka",
			"oříškový francouzský větrníček",
			"žloutkový věneček",
			"panna cotta vanilka & lesní ovoce",
			"perníčkový cake pop",
			"čokoládový dortový nanuk",
			"red velvet cupcake",
			"mini cheesecake čokoláda & lesní ovoce",
			"míša kelímek",
			"pavlova mango & marakuja",
			"tiramisu v kelímku",
			"brownies",
		],
		maxOrders: 15, // Note: This is informational only. Actual capacity is app-wide (15 total orders)
	},
	payment: {
		deposit: 450, // Deposit amount in CZK
		get description() {
			return `Objednávka je platná až po uhrazení zálohy ${this.deposit} Kč převodem na účet, doplatek je pak v hotovosti na místě při převzetí`;
		},
		qrCodePath: "/payments/payment-qr.jpg", // Universal QR code for all payments
	},
	pickup: {
		date: "v sobotu 29.11.",
		time: "od 10-11 hod",
		location: "v Ostravě-Porubě (Maďarská 6088/18)",
		pickupDate: new Date("2025-11-29"), // Fixed pickup date for all orders
	},
	orderDeadline: "do úterý 25.11. anebo do naplnění kapacity",
	message: "Děkujeme a budeme se na Vás moc těšit!",
} as const;

export type WeddingTastingData = typeof WEDDING_TASTING_DATA;

export const CHRISTMAS_SWEETS_OPTIONS = [
	{
		id: "linecke-cukrovi",
		name: "Linecké cukroví",
		pricePer100g: 110,
		approxPiecesPer100g: 15,
	},
	{
		id: "pernicky",
		name: "Perníčky",
		pricePer100g: 120,
		approxPiecesPer100g: 15,
	},
	{
		id: "vosi-hnizda",
		name: "Vosí hnízda",
		pricePer100g: 140,
		approxPiecesPer100g: 6,
	},
	{
		id: "medovnikove-koule",
		name: "Medovníkové koule",
		pricePer100g: 150,
		approxPiecesPer100g: 9,
	},
	{
		id: "vanilkove-rohlicky",
		name: "Vanilkové rohlíčky",
		pricePer100g: 100,
		approxPiecesPer100g: 15,
	},
	{
		id: "coko-skoricove-mini-tartaletky",
		name: "Čoko-skořicové mini tartaletky",
		pricePer100g: 190,
		approxPiecesPer100g: 8,
	},
	{
		id: "iselske-dorticky",
		name: "Išelské dortíčky",
		pricePer100g: 160,
		approxPiecesPer100g: 8,
	},
	{
		id: "orechovo-karamelove-trubicky",
		name: "Ořechovo-karamelové trubičky",
		pricePer100g: 160,
		approxPiecesPer100g: 14,
	},
	{
		id: "matcha-linecke",
		name: "Matcha linecké",
		pricePer100g: 200,
		approxPiecesPer100g: 14,
	},
	{
		id: "coko-pomerancove-crinkles",
		name: "Čoko-pomerančové crinkles",
		pricePer100g: 160,
		approxPiecesPer100g: 5,
	},
	{
		id: "rumove-kulicky",
		name: "Rumové kuličky",
		pricePer100g: 130,
		approxPiecesPer100g: 9,
	},
	{
		id: "pistaciove-cokomalinove-lanyzky",
		name: "Pistáciové a čokomalinové lanýžky",
		pricePer100g: 250,
		approxPiecesPer100g: 9,
	},
	{
		id: "plnene-orechy",
		name: "Plněné ořechy",
		pricePer100g: 160,
		approxPiecesPer100g: 7,
	},
	{
		id: "raffaello-kulicky",
		name: "Raffaello kuličky",
		pricePer100g: 150,
		approxPiecesPer100g: 9,
	},
] as const;

export type ChristmasSweetOption = (typeof CHRISTMAS_SWEETS_OPTIONS)[number];

export const CHRISTMAS_PAYMENT_INFO = {
	deposit: 450, // Deposit amount in CZK
	get description() {
		return `Objednávka je platná až po uhrazení zálohy ${this.deposit} Kč převodem na účet`;
	},
	qrCodePath: "/payments/payment-qr.jpg", // Universal QR code for all payments
} as const;

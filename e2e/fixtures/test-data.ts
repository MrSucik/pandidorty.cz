export const testCustomers = {
	validCustomer: {
		name: "Jan Testovací",
		email: "jan.test@example.com",
		phone: "777123456",
	},
	anotherCustomer: {
		name: "Marie Testová",
		email: "marie.test@example.com",
		phone: "777654321",
	},
	corporateCustomer: {
		name: "Firma ABC s.r.o.",
		email: "objednavky@firma-abc.cz",
		phone: "777888999",
	},
};

export const testCakes = {
	small: {
		size: "10",
		flavor: "Čokoládový",
		message: "Malý narozeninový dort",
	},
	medium: {
		size: "20",
		flavor: "Vanilkový s ovocem",
		message: "Dort pro oslavu, prosím hodně ovoce",
	},
	large: {
		size: "40",
		flavor: "Třípatrový jahodový",
		message: "Svatební dort s živými květy",
	},
	custom: {
		size: "25",
		flavor: "Karamelový s ořechy",
		message: 'Dort ve tvaru srdce s nápisem "Všechno nejlepší"',
	},
};

export const testDesserts = {
	small: "6x karamelový větrník",
	medium: "12x čokoládová tartaletka, 12x ovocný košíček",
	large: "24x makronka mix příchutí, 24x mini cheesecake, 12x profiterolky",
	custom: "30x mini dezertů dle dohody",
};

export const invalidData = {
	shortName: "A",
	invalidEmail: "not-an-email",
	shortPhone: "123",
	longPhone: "777123456789012345",
	pastDate: new Date(Date.now() - 86400000), // Yesterday
	sundayDate: (() => {
		const date = new Date();
		const daysUntilSunday = (7 - date.getDay()) % 7 || 7;
		date.setDate(date.getDate() + daysUntilSunday);
		return date;
	})(),
	mondayDate: (() => {
		const date = new Date();
		const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
		date.setDate(date.getDate() + daysUntilMonday);
		return date;
	})(),
};

export const errorMessages = {
	requiredField: "Toto pole je povinné",
	invalidEmail: "Zadejte platnou emailovou adresu",
	shortName: "Jméno musí mít alespoň 2 znaky",
	shortPhone: "Telefon musí mít alespoň 9 číslic",
	noOrderType: "Vyberte prosím alespoň jednu možnost",
	missingCakeDetails: "údaje o velikosti a příchuti",
	missingDessertChoice: "výběr dezertů",
	invalidDeliveryDay: "Objednávky přijímáme pouze na čtvrtek, pátek a sobotu",
	tooSoonDelivery: "Datum dodání musí být alespoň 7 dní od dnes",
	dateNotAvailable: "Tento termín není dostupný",
};

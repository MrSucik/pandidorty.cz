export const allowedStatuses = ["created", "paid", "delivered"] as const;

export type OrderStatus = (typeof allowedStatuses)[number];

export function getStatusColor(status: string): string {
	switch (status) {
		case "created":
			return "bg-yellow-100 text-yellow-800";
		case "paid":
			return "bg-blue-100 text-blue-800";
		case "delivered":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

export function getStatusText(status: string): string {
	switch (status) {
		case "created":
			return "Vytvořeno";
		case "paid":
			return "Zaplaceno";
		case "delivered":
			return "Doručeno";
		default:
			return status;
	}
}

export interface PaymentDetails {
	requiresDeposit: boolean;
	amountDue: number;
	balanceDue: number;
	paymentDescription: string;
	hasBalance: boolean;
	confirmationMessage: string;
}

export function calculatePaymentDetails(
	totalAmount: number,
	depositAmount: number,
): PaymentDetails {
	const requiresDeposit = totalAmount >= depositAmount;
	const amountDue = requiresDeposit ? depositAmount : totalAmount;
	const balanceDue = requiresDeposit ? totalAmount - depositAmount : 0;

	return {
		requiresDeposit,
		amountDue,
		balanceDue,
		paymentDescription: requiresDeposit
			? `zálohu ${depositAmount} Kč`
			: `částku ${totalAmount} Kč`,
		hasBalance: balanceDue > 0,
		confirmationMessage: requiresDeposit
			? "Po obdržení zálohy vám zašleme finální potvrzení."
			: "Po obdržení platby vám zašleme finální potvrzení.",
	};
}

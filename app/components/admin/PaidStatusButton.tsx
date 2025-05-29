import { useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { useRevalidator } from "react-router";

interface Props {
	orderId: number;
	paidAt: string | null;
}

export default function PaidStatusButton({ orderId, paidAt }: Props) {
	const revalidator = useRevalidator();

	const mutation = useMutation({
		mutationFn: async (isPaid: boolean) => {
			const response = await fetch(`/api/orders/${orderId}/paid`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ isPaid }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update paid status");
			}

			return response.json();
		},
		onSuccess: () => {
			revalidator.revalidate();
		},
	});

	const handleClick = () => {
		mutation.mutate(!paidAt);
	};

	return (
		<div className="flex items-center gap-2">
			<span className="font-medium text-gray-700 text-[11px]">Zaplaceno:</span>
			<button
				type="button"
				onClick={handleClick}
				disabled={mutation.isPending}
				className={`px-2 py-1 rounded-full font-semibold text-[11px] transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
					paidAt
						? "bg-blue-100 text-blue-800 hover:bg-blue-200"
						: "bg-gray-100 text-gray-600 hover:bg-gray-200"
				}`}
			>
				{mutation.isPending ? (
					"..."
				) : paidAt ? (
					<>
						{format(new Date(paidAt), "dd.MM.yyyy")}
						{" ("}
						{formatDistanceToNow(new Date(paidAt), {
							addSuffix: true,
							locale: cs,
						})}
						{")"}
					</>
				) : (
					"Ne"
				)}
			</button>
			{mutation.error && (
				<span className="text-[11px] text-red-600">
					{mutation.error.message}
				</span>
			)}
		</div>
	);
}

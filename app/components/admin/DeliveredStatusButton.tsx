import { useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { useNavigate, useRevalidator } from "react-router";

interface Props {
	orderId: number;
	deliveredAt: string | null;
}

export default function DeliveredStatusButton({ orderId, deliveredAt }: Props) {
	const revalidator = useRevalidator();
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationFn: async (isDelivered: boolean) => {
			const response = await fetch(`/api/orders/${orderId}/delivered`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ isDelivered }),
			});

			if (response.status === 401) {
				// Redirect to login on unauthorized
				navigate("/admin/login");
				throw new Error("Session expired. Please login again.");
			}

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update delivered status");
			}

			return response.json();
		},
		onSuccess: () => {
			revalidator.revalidate();
		},
	});

	const handleClick = () => {
		mutation.mutate(!deliveredAt);
	};

	return (
		<div className="flex items-center gap-2">
			<span className="font-medium text-gray-700 text-[11px]">Doručeno:</span>
			<button
				type="button"
				onClick={handleClick}
				disabled={mutation.isPending}
				className={`px-2 py-1 rounded-full font-semibold text-[11px] transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
					deliveredAt
						? "bg-green-100 text-green-800 hover:bg-green-200"
						: "bg-gray-100 text-gray-600 hover:bg-gray-200"
				}`}
			>
				{mutation.isPending ? (
					"..."
				) : deliveredAt ? (
					<>
						{format(new Date(deliveredAt), "dd.MM.yyyy")}
						{" ("}
						{formatDistanceToNow(new Date(deliveredAt), {
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

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLoaderData, useNavigate, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { getBlockedDates } from "../../server/blocked-dates.server";
import type { BlockedDateWithUser } from "../../server/blocked-dates.server";
import { requireUserSession } from "../../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireUserSession(request);

	const blockedDates = await getBlockedDates();

	return {
		blockedDates,
		user: session.user,
	};
}

function AdminSettings() {
	const { blockedDates, user } = useLoaderData<typeof loader>();
	const revalidator = useRevalidator();
	const navigate = useNavigate();
	const [date, setDate] = useState("");

	const addMutation = useMutation({
		mutationFn: async ({ date }: { date: string }) => {
			const response = await fetch("/api/blocked-dates/add", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ date }),
			});

			if (response.status === 401) {
				navigate("/admin/login");
				throw new Error("Session expired. Please login again.");
			}

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to add blocked date");
			}

			return response.json();
		},
		onSuccess: () => {
			revalidator.revalidate();
			setDate("");
		},
	});

	const removeMutation = useMutation({
		mutationFn: async (id: number) => {
			const response = await fetch("/api/blocked-dates/remove", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: id.toString() }),
			});

			if (response.status === 401) {
				navigate("/admin/login");
				throw new Error("Session expired. Please login again.");
			}

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to remove blocked date");
			}

			return response.json();
		},
		onSuccess: () => {
			revalidator.revalidate();
		},
	});

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat("cs-CZ", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(date);
	};

	const getTodayString = () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");
		const day = String(today.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (date) {
			addMutation.mutate({ date });
		}
	};

	const handleRemove = (id: number) => {
		removeMutation.mutate(id);
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex-1">
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
							Nastavení systému
						</h1>
						<p className="mt-2 text-gray-600">Správa blokovaných termínů</p>
					</div>
					<Link
						to="/admin"
						className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
					>
						<svg
							className="mr-2 -ml-1 w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Zpět na dashboard
					</Link>
				</div>

				{/* Add new blocked date form */}
				<div className="bg-white shadow rounded-lg p-6 mb-8">
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Přidat blokovaný termín
					</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="date"
								className="block text-sm font-medium text-gray-700"
							>
								Datum
							</label>
							<input
								type="date"
								id="date"
								name="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								min={getTodayString()}
								required
								className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
							/>
						</div>
						<button
							type="submit"
							disabled={addMutation.isPending}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{addMutation.isPending
								? "Přidávám..."
								: "Přidat blokovaný termín"}
						</button>
						{addMutation.error && (
							<p className="text-red-600 text-sm mt-2">
								{addMutation.error.message}
							</p>
						)}
					</form>
				</div>

				{/* List of blocked dates */}
				<div className="bg-white shadow rounded-lg">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-medium text-gray-900">
							Blokované termíny ({blockedDates.length})
						</h2>
					</div>
					{blockedDates.length > 0 ? (
						<ul className="divide-y divide-gray-200">
							{blockedDates.map((blockedDate) => (
								<li key={blockedDate.id} className="px-6 py-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-gray-900">
												{formatDate(blockedDate.date)}
											</p>
											<p className="text-xs text-gray-400 mt-1">
												Přidal: {blockedDate.createdBy.name} •{" "}
												{new Intl.DateTimeFormat("cs-CZ", {
													year: "numeric",
													month: "2-digit",
													day: "2-digit",
													hour: "2-digit",
													minute: "2-digit",
												}).format(new Date(blockedDate.createdAt))}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => handleRemove(blockedDate.id)}
												disabled={removeMutation.isPending}
												className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{removeMutation.isPending
													? "Odstraňuji..."
													: "Odstranit"}
											</button>
											{removeMutation.error && (
												<span className="text-xs text-red-600">
													{removeMutation.error.message}
												</span>
											)}
										</div>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="px-6 py-12 text-center">
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 7V3m8 4V3m-9 8h10m-6 4h2m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<h3 className="mt-2 text-sm font-medium text-gray-900">
								Žádné blokované termíny
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								Začněte přidáním prvního blokovaného termínu.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default AdminSettings;

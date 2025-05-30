import { useEffect } from "react";
import { Form, Link, useLoaderData, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import type { OrderStats } from "../../server/get-order-stats.server";
import { getOrderStats } from "../../server/get-order-stats.server";
import { requireUserSession } from "../../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireUserSession(request);

	// Load statistics for dashboard via server-side utility
	const stats = await getOrderStats();

	return {
		stats,
		user: session.user,
	};
}

function AdminDashboard() {
	const { stats, user } = useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">Administrace</h1>
						<p className="mt-2 text-gray-600">Správa objednávek a systému</p>
						<p className="mt-1 text-sm text-gray-500">
							Přihlášen jako: {user.name}
						</p>
					</div>
					<div className="flex gap-4">
						<Form action="/admin/logout" method="post">
							<button
								type="submit"
								className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
							>
								Odhlásit
							</button>
						</Form>
						<Link
							to="/"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-pink-600 bg-pink-100 hover:bg-pink-200"
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
							Zpět
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Orders Management */}
					<Link to="/admin/orders">
						<div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="w-8 h-8 bg-pink-600 rounded-md flex items-center justify-center">
											<svg
												className="w-5 h-5 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Ikona objednávek"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 truncate">
												Objednávky
											</dt>
											<dd className="text-lg font-medium text-gray-900">
												Správa objednávek
											</dd>
										</dl>
									</div>
								</div>
							</div>
							<div className="bg-gray-50 px-5 py-3">
								<div className="text-sm">
									<span className="font-medium text-pink-600 hover:text-pink-500">
										Zobrazit všechny objednávky →
									</span>
								</div>
							</div>
						</div>
					</Link>

					{/* Users Management */}
					<Link to="/admin/users">
						<div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="w-8 h-8 bg-pink-600 rounded-md flex items-center justify-center">
											<svg
												className="w-5 h-5 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Ikona uživatelů"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
												/>
											</svg>
										</div>
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 truncate">
												Uživatelé
											</dt>
											<dd className="text-lg font-medium text-gray-900">
												Správa uživatelů
											</dd>
										</dl>
									</div>
								</div>
							</div>
							<div className="bg-gray-50 px-5 py-3">
								<div className="text-sm">
									<span className="font-medium text-pink-600 hover:text-pink-500">
										Zobrazit všechny uživatele →
									</span>
								</div>
							</div>
						</div>
					</Link>

					{/* Settings */}
					<Link to="/admin/settings">
						<div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<div className="w-8 h-8 bg-pink-600 rounded-md flex items-center justify-center">
											<svg
												className="w-5 h-5 text-white"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Ikona nastavení"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										</div>
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 truncate">
												Nastavení
											</dt>
											<dd className="text-lg font-medium text-gray-900">
												Konfigurace systému
											</dd>
										</dl>
									</div>
								</div>
							</div>
							<div className="bg-gray-50 px-5 py-3">
								<div className="text-sm">
									<span className="font-medium text-pink-600 hover:text-pink-500">
										Spravovat blokované termíny →
									</span>
								</div>
							</div>
						</div>
					</Link>
				</div>

				{/* Quick Stats */}
				<div className="mt-8">
					<h2 className="text-lg font-medium text-gray-900 mb-4">
						Rychlý přehled
					</h2>
					<div className="bg-white shadow rounded-lg p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="text-2xl font-bold text-blue-600">
									{stats.paid}
								</div>
								<div className="text-sm text-gray-500">Zaplacené</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-green-600">
									{stats.delivered}
								</div>
								<div className="text-sm text-gray-500">Doručené</div>
							</div>
							<div className="text-center">
								<div className="text-2xl font-bold text-gray-600">
									{stats.total}
								</div>
								<div className="text-sm text-gray-500">Celkem</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default AdminDashboard;

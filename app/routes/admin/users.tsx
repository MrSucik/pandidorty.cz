import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { getAdminUsers } from "../../server/get-admin-users.server";
import type { AdminUser } from "../../server/get-admin-users.server";
import { requireUserSession } from "../../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireUserSession(request);

	const users = await getAdminUsers();

	return {
		users,
		currentUser: session.user,
	};
}

function AdminUsers() {
	const { users, currentUser } = useLoaderData<typeof loader>();

	const formatDate = (date: Date | null) => {
		if (!date) return "Nikdy";
		return new Intl.DateTimeFormat("cs-CZ", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(date));
	};

	const isAccountLocked = (user: AdminUser) => {
		return user.lockedUntil && new Date(user.lockedUntil) > new Date();
	};

	const getStatusBadge = (user: AdminUser) => {
		if (!user.isActive) {
			return (
				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
					Neaktivní
				</span>
			);
		}
		if (isAccountLocked(user)) {
			return (
				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
					Uzamčený
				</span>
			);
		}
		return (
			<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
				Aktivní
			</span>
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 pt-8">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Správa uživatelů
						</h1>
						<p className="mt-2 text-gray-600">Administrátorské účty systému</p>
						<p className="mt-1 text-sm text-gray-500">
							Celkem uživatelů: {users.length}
						</p>
					</div>
					<div className="flex gap-4">
						<Link
							to="/admin"
							className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
							Zpět na administraci
						</Link>
					</div>
				</div>

				<div className="bg-white shadow overflow-hidden sm:rounded-md">
					<ul className="divide-y divide-gray-200">
						{users.map((user) => (
							<li key={user.id}>
								<div className="px-4 py-4 sm:px-6">
									<div className="flex items-center justify-between">
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
													<span className="text-sm font-medium text-white">
														{user.name.charAt(0).toUpperCase()}
													</span>
												</div>
											</div>
											<div className="ml-4">
												<div className="flex items-center">
													<p className="text-sm font-medium text-gray-900">
														{user.name}
														{user.id === currentUser.id && (
															<span className="ml-2 text-xs text-pink-600 font-medium">
																(Vy)
															</span>
														)}
													</p>
													<div className="ml-2">{getStatusBadge(user)}</div>
												</div>
												<p className="text-sm text-gray-500">{user.email}</p>
											</div>
										</div>
										<div className="flex flex-col items-end text-sm text-gray-500">
											<p>Posledně přihlášen: {formatDate(user.lastLogin)}</p>
											<p>Vytvořen: {formatDate(user.createdAt)}</p>
											{user.failedLoginAttempts > 0 && (
												<p className="text-yellow-600">
													Neúspěšné pokusy: {user.failedLoginAttempts}
												</p>
											)}
											{isAccountLocked(user) && (
												<p className="text-red-600">
													Uzamčen do: {formatDate(user.lockedUntil)}
												</p>
											)}
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>
				</div>

				{users.length === 0 && (
					<div className="text-center py-12">
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
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							/>
						</svg>
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							Žádní uživatelé
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							Nebyly nalezeny žádné administrátorské účty.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default AdminUsers;

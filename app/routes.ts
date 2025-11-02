import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("cakes", "routes/cakes.tsx"),
	route("gallery", "routes/gallery.tsx"),
	route("objednavka", "routes/objednavka.tsx"),
	route("svatebni-ochutnavka", "routes/svatebni-ochutnavka.tsx"),
	route("admin", "routes/admin/index.tsx"),
	route("admin/login", "routes/admin/login.tsx"),
	route("admin/logout", "routes/admin/logout.tsx"),
	route("admin/orders", "routes/admin/orders.tsx"),
	route("admin/users", "routes/admin/users.tsx"),
	route("admin/settings", "routes/admin/settings.tsx"),
	route("photo/:photoId", "routes/photo.$photoId.ts"),
	route("api/submit-order", "routes/api.submit-order.ts"),
	route("api/submit-wedding-tasting", "routes/api.submit-wedding-tasting.ts"),
	route("api/orders/:orderId/paid", "routes/api.orders.$orderId.paid.ts"),
	route(
		"api/orders/:orderId/delivered",
		"routes/api.orders.$orderId.delivered.ts",
	),
	route("api/blocked-dates/add", "routes/api.blocked-dates.add.ts"),
	route("api/blocked-dates/remove", "routes/api.blocked-dates.remove.ts"),
	route("api/test-email", "routes/api.test-email.ts"),
] satisfies RouteConfig;

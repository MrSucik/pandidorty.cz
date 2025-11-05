import { index, type RouteConfig, route } from "@react-router/dev/routes";
import {
	FEATURE_CHRISTMAS_ORDER,
	FEATURE_WEDDING_TASTING,
} from "./config/features";

const baseRoutes: RouteConfig = [
	index("routes/index.tsx"),
	route("cakes", "routes/cakes.tsx"),
	route("gallery", "routes/gallery.tsx"),
	route("objednavka", "routes/objednavka.tsx"),
	route("admin", "routes/admin/index.tsx"),
	route("admin/login", "routes/admin/login.tsx"),
	route("admin/logout", "routes/admin/logout.tsx"),
	route("admin/orders", "routes/admin/orders.tsx"),
	route("admin/users", "routes/admin/users.tsx"),
	route("admin/settings", "routes/admin/settings.tsx"),
	route("photo/:photoId", "routes/photo.$photoId.ts"),
	route("api/submit-order", "routes/api.submit-order.ts"),
	route("api/orders/:orderId/paid", "routes/api.orders.$orderId.paid.ts"),
	route(
		"api/orders/:orderId/delivered",
		"routes/api.orders.$orderId.delivered.ts",
	),
	route("api/blocked-dates/add", "routes/api.blocked-dates.add.ts"),
	route("api/blocked-dates/remove", "routes/api.blocked-dates.remove.ts"),
	route("api/test-email", "routes/api.test-email.ts"),
];

// Conditionally add wedding tasting routes
const weddingRoutes: RouteConfig = FEATURE_WEDDING_TASTING
	? [
			route("svatebni-ochutnavka", "routes/svatebni-ochutnavka.tsx"),
			route("api/submit-wedding-tasting", "routes/api.submit-wedding-tasting.ts"),
		]
	: [];

// Conditionally add Christmas order routes
const christmasRoutes: RouteConfig = FEATURE_CHRISTMAS_ORDER
	? [
			route("vanocni-cukrovi", "routes/vanocni-cukrovi.tsx"),
			route("api/submit-christmas-order", "routes/api.submit-christmas-order.ts"),
		]
	: [];

export default [...baseRoutes, ...weddingRoutes, ...christmasRoutes] satisfies RouteConfig;

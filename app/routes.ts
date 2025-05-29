import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("cakes", "routes/cakes.tsx"),
	route("gallery", "routes/gallery.tsx"),
	route("objednavka", "routes/objednavka.tsx"),
	route("admin", "routes/admin/index.tsx"),
	route("admin/orders", "routes/admin/orders.tsx"),
	route("photo/:photoId", "routes/photo.$photoId.ts"),
	route("api/submit-order", "routes/api.submit-order.ts"),
	route("api/orders/:orderId/paid", "routes/api.orders.$orderId.paid.ts"),
	route(
		"api/orders/:orderId/delivered",
		"routes/api.orders.$orderId.delivered.ts",
	),
] satisfies RouteConfig;

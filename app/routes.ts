import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("cakes", "routes/cakes.tsx"),
	route("gallery", "routes/gallery.tsx"),
	route("objednavka", "routes/objednavka.tsx"),
	route("admin", "routes/admin/index.tsx"),
	route("admin/orders", "routes/admin/orders.tsx"),
	route("photo/:photoId", "routes/photo.$photoId.ts"),
] satisfies RouteConfig;

// app.config.ts
import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
	server: {
		preset: "node-server",
	},
});

// Or you can use the --preset flag with the build command
// to specify the deployment target when building the application:
// npm run build --preset node-server

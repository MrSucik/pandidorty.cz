import type { ActionFunctionArgs } from "react-router";
import { Resend } from "resend";

export async function action({ request }: ActionFunctionArgs) {
	if (request.method !== "POST") {
		return Response.json({ error: "Method not allowed" }, { status: 405 });
	}

	if (!process.env.RESEND_API_KEY) {
		return Response.json(
			{ error: "RESEND_API_KEY not configured" },
			{ status: 500 },
		);
	}

	try {
		const resend = new Resend(process.env.RESEND_API_KEY);

		await resend.emails.send({
			from: "Pandí Dorty <pandidorty@danielsuchan.dev>",
			to: "mr.sucik@gmail.com",
			subject: "Test Email - Pandí Dorty",
			text: `
Test email sent at: ${new Date().toISOString()}

This is a test email to verify that the email service is working correctly.

System details:
- Environment: ${process.env.NODE_ENV || "development"}
- Timestamp: ${Date.now()}

Best regards,
Pandí Dorty System
`,
		});

		return Response.json({
			success: true,
			message: "Test email sent successfully to mr.sucik@gmail.com",
		});
	} catch (error) {
		console.error("Error sending test email:", error);
		return Response.json(
			{
				error: "Failed to send test email",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

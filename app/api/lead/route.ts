import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
export async function POST(req: NextRequest) {
	const body = await req.json();

	if (!body.email) {
		return NextResponse.json(
			{ error: "Email is required" },
			{ status: 400 }
		);
	}

	try {
		// Here you can add your own logic
		// For instance, sending a welcome email (use the the sendEmail helper function from /libs/mailgun)
		// For instance, saving the lead in the database (uncomment the code below)

		// const supabase = createClient();
		// await supabase.from("leads").insert({ email: body.email });

		return NextResponse.json({});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: e.message }, { status: 500 });
	}
}

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if email already exists in eligible_emails collection
    const eligibleEmailsRef = db.collection("eligible_emails");
    const snapshot = await eligibleEmailsRef.where("email", "==", email).get();

    if (!snapshot.empty) {
      // Email already exists, update timestamp
      const emailDoc = snapshot.docs[0];
      await emailDoc.ref.update({
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        message: "Email already in eligible list.",
        emailId: emailDoc.id,
        existed: true,
      });
    }

    // Add new eligible email
    const newEmailRef = await eligibleEmailsRef.add({
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also update existing user if they already signed in
    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await userDoc.ref.update({
        isEligible: true,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: "Email added to eligible list successfully",
      emailId: newEmailRef.id,
      existed: false,
    });
  } catch (error) {
    console.error("Error creating eligible email:", error);
    return NextResponse.json(
      { error: "Failed to add email", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all eligible emails for display
    const eligibleEmailsRef = db.collection("eligible_emails");
    const snapshot = await eligibleEmailsRef
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const emails = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching eligible emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error.message },
      { status: 500 }
    );
  }
}

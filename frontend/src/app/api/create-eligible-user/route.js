import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const eligibleEmailsRef = db.collection("eligible_emails");
    const usersRef = db.collection("users");

    const userSnap = await usersRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();
    const userDoc = userSnap.empty ? null : userSnap.docs[0];

    // หา eligible doc
    const eligibleSnap = await eligibleEmailsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!eligibleSnap.empty) {
      const emailDoc = eligibleSnap.docs[0];
      const emailData = emailDoc.data();

      const updates = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      // ✅ เติม userId ถ้ามี user แล้ว และ eligible ยังไม่มี/ไม่ตรง
      if (userDoc && emailData.userId !== userDoc.id) {
        updates.userId = userDoc.id;
      }

      await emailDoc.ref.set(updates, { merge: true });

      // (optional) mark user eligible
      if (userDoc) {
        await userDoc.ref.set(
          { isEligible: true, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }

      return NextResponse.json({
        message: "Email already in eligible list.",
        userId: userDoc ? userDoc.id : null,
        emailId: emailDoc.id,
        existed: true,
      });
    }

    // ✅ เพิ่มใหม่ พร้อม userId ถ้ามี user อยู่แล้ว
    const payload = {
      email: normalizedEmail,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (userDoc) payload.userId = userDoc.id;

    const newEmailRef = await eligibleEmailsRef.add(payload);

    // (optional) mark user eligible
    if (userDoc) {
      await userDoc.ref.set(
        { isEligible: true, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    return NextResponse.json({
      message: "Email added to eligible list successfully",
      userId: userDoc ? userDoc.id : null,
      emailId: newEmailRef.id,
      existed: false,
    });
  } catch (error) {
    console.error("Error creating eligible email:", error);
    return NextResponse.json(
      {
        error: "Failed to add email",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}

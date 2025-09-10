import {NextRequest, NextResponse} from "next/server";
import {adminDb} from "@/lib/firebaseAdmin";

// GET - Fetch all plans for a user
export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({error: "User ID is required"}, {status: 400});
    }

    const plansCollection = adminDb.collection("users").doc(userId).collection("plans");
    const snapshot = await plansCollection.get();

    if (snapshot.empty) {
      const defaultPlan = {
        name: "My First Weekend",
        color: "#0000ff",
        schedule: {saturday: [], sunday: []},
        category: "all",
      };

      await plansCollection.doc("default_plan").set(defaultPlan);

      return NextResponse.json([{id: "default_plan", ...defaultPlan}]);
    }

    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({error: "Failed to fetch plans"}, {status: 500});
  }
}

// POST - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const {userId, name, color} = await request.json();

    if (!userId || !name || !color) {
      return NextResponse.json({error: "Missing required fields: userId, name, color"}, {status: 400});
    }

    const newPlanId = crypto.randomUUID();
    const newPlan = {
      name,
      color,
      schedule: {saturday: [], sunday: []},
      category: "all",
    };

    const planRef = adminDb.collection("users").doc(userId).collection("plans").doc(newPlanId);
    await planRef.set(newPlan);

    return NextResponse.json({id: newPlanId, ...newPlan}, {status: 201});
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json({error: "Failed to create plan"}, {status: 500});
  }
}

// PUT - Update a plan
export async function PUT(request: NextRequest) {
  try {
    const {userId, planId, updates} = await request.json();

    if (!userId || !planId || !updates) {
      return NextResponse.json({error: "Missing required fields: userId, planId, updates"}, {status: 400});
    }

    const planRef = adminDb.collection("users").doc(userId).collection("plans").doc(planId);

    // Check if plan exists
    const planDoc = await planRef.get();
    if (!planDoc.exists) {
      return NextResponse.json({error: "Plan not found"}, {status: 404});
    }

    await planRef.update(updates);

    return NextResponse.json({success: true});
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json({error: "Failed to update plan"}, {status: 500});
  }
}

// DELETE - Delete a plan
export async function DELETE(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const userId = searchParams.get("userId");
    const planId = searchParams.get("planId");

    if (!userId || !planId) {
      return NextResponse.json({error: "User ID and Plan ID are required"}, {status: 400});
    }

    const planRef = adminDb.collection("users").doc(userId).collection("plans").doc(planId);

    // Check if plan exists
    const planDoc = await planRef.get();
    if (!planDoc.exists) {
      return NextResponse.json({error: "Plan not found"}, {status: 404});
    }

    await planRef.delete();

    return NextResponse.json({success: true});
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json({error: "Failed to delete plan"}, {status: 500});
  }
}

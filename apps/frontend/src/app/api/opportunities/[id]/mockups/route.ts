import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    await requireSession();

    const opportunityId = Number(params.id);
    if (Number.isNaN(opportunityId)) {
        return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    const mockup = await prisma.mockup.create({
        data: {
            opportunityId: opportunityId,
        },
    });

    return NextResponse.json(mockup);
}

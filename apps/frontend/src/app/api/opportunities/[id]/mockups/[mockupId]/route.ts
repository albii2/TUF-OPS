import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function PUT(request: Request, { params }: { params: { id: string, mockupId: string } }) {
    await requireSession();

    const mockupId = Number(params.mockupId);
    if (Number.isNaN(mockupId)) {
        return NextResponse.json({ error: "Invalid mockup ID" }, { status: 400 });
    }

    const body = await request.json();

    const mockup = await prisma.mockup.update({
        where: {
            id: mockupId,
        },
        data: {
            status: body.status,
            notes: body.notes,
        },
    });

    return NextResponse.json(mockup);
}

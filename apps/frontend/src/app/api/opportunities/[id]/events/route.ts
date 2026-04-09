import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await requireSession();

    const opportunityId = Number(params.id);
    if (Number.isNaN(opportunityId)) {
        return NextResponse.json({ error: "Invalid opportunity ID" }, { status: 400 });
    }

    const events = await prisma.opportunityEvent.findMany({
        where: {
            opportunityId: opportunityId,
        },
        include: {
            actorUser: {
                select: {
                    name: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        }
    });

    return NextResponse.json(events);
}

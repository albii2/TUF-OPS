import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pipeline = await prisma.opportunity.groupBy({
    by: ["stage"],
    _count: {
      id: true,
    },
  });

  const totalRevenueResult = await prisma.invoice.aggregate({
    where: { status: "Paid" },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue = totalRevenueResult._sum.amount?.toNumber() || 0;

  let directorData = null;
  if (session.user.role === "director" || session.user.role === "admin") {
    const totalCostResult = await prisma.uniformOrder.aggregate({
      _sum: {
        vendor_cost: true,
      },
    });
    const totalCost = totalCostResult._sum.vendor_cost?.toNumber() || 0;
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

    directorData = {
      totalCost,
      grossMargin: grossMargin.toFixed(2) + '%',
    };
  }

  return NextResponse.json({
    pipeline,
    totalRevenue,
    directorData,
  });
}

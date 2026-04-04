'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// TODO: This should be stored in a company settings table
const INVOICE_PREFIX = "TUF-";

const generateInvoiceSchema = z.object({
    opportunityId: z.number(),
    customerName: z.string(),
    teamName: z.string(),
    streetAddress: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentTerms: z.string().optional(),
    salesperson: z.string().optional(),
    orderType: z.string().optional(),
    amount: z.coerce.number().min(1),
    dueDate: z.date().optional(),
});

export async function generateInvoice(input: unknown) {
    const session = await requireSession();
    const data = generateInvoiceSchema.parse(input);

    // Get the latest invoice to determine the next invoice number
    const latestInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    let nextInvoiceNumber = 1;
    if (latestInvoice && latestInvoice.invoiceNumber.startsWith(INVOICE_PREFIX)) {
        const lastNumber = parseInt(latestInvoice.invoiceNumber.replace(INVOICE_PREFIX, ''), 10);
        nextInvoiceNumber = lastNumber + 1;
    }

    const invoiceNumber = `${INVOICE_PREFIX}${String(nextInvoiceNumber).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
        data: {
            ...data,
            invoiceNumber,
            status: "Draft",
        }
    });

    revalidatePath(`/orders/.*`, 'page');

    return invoice;
}

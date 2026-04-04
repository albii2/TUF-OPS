'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Opportunity as PrismaOpportunity, Organization, Invoice } from "@prisma/client";
import { generateInvoice } from "@/app/(app)/orders/_actions/generateInvoice";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { createPaypalOrder, capturePaypalOrder } from "@/app/(app)/orders/_actions/paypal";

type OpportunityWithRelations = Omit<PrismaOpportunity, 'estimated_value'> & {
  estimated_value: number;
  organization: Organization;
  invoices: Invoice[];
};

interface GenerateInvoiceFormProps {
  opportunity: OpportunityWithRelations;
  children: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

export function GenerateInvoiceForm({ opportunity, children, disabled = false, disabledReason }: GenerateInvoiceFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const invoice = opportunity.invoices[0];

  const handleGenerateInvoice = () => {
    if (disabled) return;
    startTransition(() => {
      toast.info("Generating invoice...");
      generateInvoice({ 
          opportunityId: opportunity.id, 
          customerName: opportunity.organization.name,
          teamName: opportunity.name,
          amount: opportunity.estimated_value,
      })
        .then(() => {
          toast.success("Invoice generated successfully. You can now proceed to payment.");
          router.refresh();
        })
        .catch((err) => {
          toast.error("Failed to generate invoice.");
        });
    });
  };

  const trigger = (
    <div className={disabled ? "cursor-not-allowed" : ""}>
        {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {disabled ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent><p>{disabledReason}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{invoice ? `Invoice #${invoice.invoiceNumber}` : "Generate Invoice"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {invoice ? (
            <div>
              <p>An invoice has been generated for this order. You can now proceed to payment.</p>
              <p className="font-semibold text-lg my-4">Amount: ${invoice.amount.toFixed(2)}</p>
              <PayPalScriptProvider options={{ "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID! }}>
                <PayPalButtons 
                    style={{ layout: "vertical" }}
                    createOrder={async (data, actions) => {
                        return createPaypalOrder(invoice.id);
                    }}
                    onApprove={async (data, actions) => {
                        toast.info("Processing payment...");
                        const order = await capturePaypalOrder(data.orderID);
                        if (order.status === 'COMPLETED') {
                            toast.success("Payment successful!");
                            setOpen(false);
                            router.refresh();
                        } else {
                            toast.error("Payment failed. Please try again.");
                        }
                        return Promise.resolve();
                    }}
                />
              </PayPalScriptProvider>
            </div>
          ) : (
            <div>
              <p>Click the button below to generate an invoice for this order. The amount will be pre-filled based on the opportunity value.</p>
              <Button onClick={handleGenerateInvoice} disabled={isPending} className="w-full mt-4">
                {isPending ? "Generating..." : `Generate Invoice for $${opportunity.estimated_value}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

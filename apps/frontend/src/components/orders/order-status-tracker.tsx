'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { OrderStatus } from "@prisma/client"
import { useSession } from "next-auth/react"
import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { updateOrderStatus } from "@/app/(app)/orders/_actions/updateOrderStatus"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Check, Loader, FileText, Factory, Truck, PackageCheck } from 'lucide-react';

// The full list of granular, internal-facing statuses
const allOrderStatuses = Object.values(OrderStatus);

// The simplified, customer-facing tracker stages
const visualSteps = [
  { stage: 'Processing', icon: Loader, statuses: ['Pending', 'AwaitingMockup', 'MockupApproved', 'AwaitingSample', 'SampleDelivered', 'AwaitingRoster', 'RosterConfirmed', 'AwaitingPayment'] },
  { stage: 'Production', icon: Factory, statuses: ['InProduction'] },
  { stage: 'Shipped', icon: Truck, statuses: ['Shipped'] },
  { stage: 'Delivered', icon: PackageCheck, statuses: ['Completed'] },
];

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
})

interface OrderStatusTrackerProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusTracker({ orderId, currentStatus }: OrderStatusTrackerProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof UpdateOrderStatusSchema>>({
    resolver: zodResolver(UpdateOrderStatusSchema),
    defaultValues: {
      status: currentStatus,
    },
  })

  const userIsAdminOrDirector = session?.user.role === 'admin' || session?.user.role === 'director';

  function onSubmit(data: z.infer<typeof UpdateOrderStatusSchema>) {
    startTransition(async () => {
      try {
        await updateOrderStatus({ orderId, status: data.status });
        toast.success("Order status updated successfully!");
      } catch (error) {
        toast.error("Failed to update order status. You may not have permission.");
      }
    });
  }

  const currentVisualStepIndex = visualSteps.findIndex(step => step.statuses.includes(currentStatus));

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Order Status</h3>
        {userIsAdminOrDirector && (
          <Form {...form}>
            <form onChange={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Update Internal Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allOrderStatuses.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}
      </div>
      <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
          {visualSteps.map((step, stepIdx) => {
            const isCompleted = stepIdx <= currentVisualStepIndex;
            const isCurrent = stepIdx === currentVisualStepIndex;

            return (
              <li key={step.stage} className={cn('relative flex-1', { 'pr-8 sm:pr-20': stepIdx !== visualSteps.length - 1 })}>
                  <div className="absolute inset-0 top-1/2 -translate-y-1/2" aria-hidden="true">
                    <div className={cn("h-0.5 w-full", isCompleted ? "bg-primary" : "bg-gray-200")} />
                  </div>
                  <div className="relative flex flex-col items-center text-center">
                    <div
                        className={cn(
                        "relative flex h-10 w-10 items-center justify-center rounded-full",
                        isCompleted ? "bg-primary text-primary-foreground" : "border-2 border-gray-300 bg-background"
                        )}
                    >
                        <step.icon className="h-6 w-6" />
                    </div>
                    <p className={cn("mt-3 text-sm font-semibold", isCompleted ? "text-foreground" : "text-muted-foreground")}>
                        {step.stage}
                    </p>
                  </div>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  );
}

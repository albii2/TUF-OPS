'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { requestMockup } from "@/app/(app)/orders/_actions/requestMockup";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  notes: z.string().optional(),
  jerseyNumber: z.string().optional(),
  logo: z.string().optional(),
  colors: z.string().optional(),
});

interface RequestMockupFormProps {
  opportunityId: number;
  children: React.ReactNode;
}

export function RequestMockupForm({ opportunityId, children }: RequestMockupFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      notes: "",
      jerseyNumber: "",
      logo: "",
      colors: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      toast.info("Submitting mockup request...");
      requestMockup({ opportunityId, ...values })
        .then(() => {
          toast.success("Mockup requested successfully.");
          setOpen(false);
          router.refresh();
        })
        .catch((err) => {
          toast.error("Failed to request mockup.");
        });
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a Mockup</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="jerseyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jersey Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1, 23, 99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., School Mascot, Team Logo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="colors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colors</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Red, White, Blue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any other specific instructions for the design team..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

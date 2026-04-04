'use client'

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { submitRoster } from "@/app/(app)/orders/_actions/submitRoster";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  fileUrl: z.string().url("Please enter a valid URL."),
});

interface RosterUploadFormProps {
  orderId: string;
  children: React.ReactNode;
}

export function RosterUploadForm({ orderId, children }: RosterUploadFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fileUrl: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      toast.info("Submitting roster...");
      submitRoster({ orderId, ...values })
        .then(() => {
          toast.success("Roster submitted successfully.");
          setOpen(false);
          router.refresh();
        })
        .catch((err) => {
          toast.error("Failed to submit roster.");
        });
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Roster</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
            Please upload your roster file (e.g., Google Sheets, Excel Online) and paste the shareable link below.
        </p>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roster File URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://docs.google.com/spreadsheets/d/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Submitting..." : "Submit Roster"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

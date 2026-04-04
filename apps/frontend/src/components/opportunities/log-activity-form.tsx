'use client'

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ActivityType, Contact } from "@prisma/client";
import { logActivity, logActivitySchema } from "@/app/(app)/opportunities/_actions/logActivity";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Users } from "lucide-react";

interface LogActivityFormProps {
  opportunityId: number;
  contacts: Contact[];
}

export function LogActivityForm({ opportunityId, contacts }: LogActivityFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof logActivitySchema>>({
    resolver: zodResolver(logActivitySchema),
    defaultValues: {
      opportunityId,
      type: ActivityType.CALL,
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      toast.promise(logActivity(values), {
        loading: "Logging activity...",
        success: () => {
          form.reset();
          // Reset to default values after submission
          form.reset({
            opportunityId,
            type: ActivityType.CALL,
            notes: "",
            contactId: undefined,
          });
          return "Activity logged successfully.";
        },
        error: "Failed to log activity.",
      });
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log an Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ActivityType.CALL}><Phone className="w-4 h-4 mr-2 inline-block"/>Call</SelectItem>
                        <SelectItem value={ActivityType.EMAIL}><Mail className="w-4 h-4 mr-2 inline-block"/>Email</SelectItem>
                        <SelectItem value={ActivityType.MEETING}><Users className="w-4 h-4 mr-2 inline-block"/>Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem className="w-2/3">
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a contact (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map(contact => (
                            <SelectItem key={contact.id} value={String(contact.id)}>{contact.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} placeholder="Add notes about the activity..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Logging..." : "Log Activity"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

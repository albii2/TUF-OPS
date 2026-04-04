'use client'

import { Contact } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddContactForm } from "./add-contact-form";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ProgramContactsCardProps {
  programId: number;
  contacts: Contact[];
}

export function ProgramContactsCard({ programId, contacts }: ProgramContactsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contacts</CardTitle>
        <AddContactForm programId={programId}>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </AddContactForm>
      </CardHeader>
      <CardContent>
        {contacts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <li key={contact.id} className="py-3">
                <p className="font-semibold text-sm">{contact.name}</p>
                <p className="text-muted-foreground text-sm">{contact.title}</p>
                <div className="flex gap-4 mt-1">
                    <p className="text-muted-foreground text-xs">{contact.email}</p>
                    <p className="text-muted-foreground text-xs">{contact.phone}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <p>No contacts have been added to this organization yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

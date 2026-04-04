import { Lead } from "@prisma/client";

export type LeadQueueEntry = Lead & { assignedTo: { name: string } | null };

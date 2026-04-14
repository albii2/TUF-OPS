import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CalendarCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type Action = {
    id: number;
    name: string;
    nextStep: string | null;
    nextStepDueDate: Date | null;
};

interface NextActionsPanelProps {
    overdue: Action[];
    upcoming: Action[];
}

function ActionItem({ action, isOverdue }: { action: Action, isOverdue: boolean }) {
    return (
        <div className="flex items-start space-x-4">
            {isOverdue ? (
                <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
            ) : (
                <CalendarCheck className="h-5 w-5 text-blue-500 mt-1" />
            )}
            <div>
                <Link href={`/opportunities/${action.id}`} className="font-medium hover:underline">
                    {action.name}
                </Link>
                <p className="text-sm text-muted-foreground">{action.nextStep}</p>
                {action.nextStepDueDate && (
                    <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                        {isOverdue ? "Due" : "Due"} {formatDistanceToNow(action.nextStepDueDate, { addSuffix: true })}
                        ({format(action.nextStepDueDate, "MMM d")})
                    </p>
                )}
            </div>
        </div>
    );
}

export function NextActionsPanel({ overdue, upcoming }: NextActionsPanelProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Next Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {overdue.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-red-600 mb-2">Overdue</h3>
                        <div className="space-y-4">
                            {overdue.map(action => <ActionItem key={`overdue-${action.id}`} action={action} isOverdue={true} />)}
                        </div>
                    </div>
                )}
                {upcoming.length > 0 && (
                     <div>
                        <h3 className="text-sm font-semibold text-blue-600 mb-2">Upcoming</h3>
                        <div className="space-y-4">
                            {upcoming.map(action => <ActionItem key={`upcoming-${action.id}`} action={action} isOverdue={false} />)}
                        </div>
                    </div>
                )}
                {overdue.length === 0 && upcoming.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No upcoming actions.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

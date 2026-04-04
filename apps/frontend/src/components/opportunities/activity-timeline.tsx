'use client'

import { Activity, Contact, User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ActivityWithRelations = Activity & { 
    user: User;
    contact?: Contact | null;
};

interface ActivityTimelineProps {
  activities: ActivityWithRelations[];
}

const activityIcons = {
  CALL: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  MEETING: <Users className="h-4 w-4" />,
};

function ActivityItem({ activity }: { activity: ActivityWithRelations }) {
  return (
    <li className="flex gap-4 py-4">
        <Avatar className="h-9 w-9">
            <AvatarImage src={activity.user.image ?? undefined} alt={activity.user.name ?? "User"} />
            <AvatarFallback>{activity.user.name?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">
                {activity.user.name}
                </p>
                <time className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()}
                </time>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 py-0.5 px-1.5">
                    {activityIcons[activity.type]} 
                    <span className="text-xs">{activity.type}</span>
                </Badge>
                {activity.contact && <Badge variant="outline">{activity.contact.name}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {activity.notes}
            </p>
        </div>
    </li>
  );
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity ({activities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ul className="-my-4 divide-y divide-gray-200">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-6">
            <p>No activities have been logged for this opportunity yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

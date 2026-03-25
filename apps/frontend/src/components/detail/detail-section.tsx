import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function DetailSection({ title, children, actions }: DetailSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

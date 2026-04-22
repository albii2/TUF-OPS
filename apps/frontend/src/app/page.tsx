import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TUF Ops Dashboard</h1>
        <div className="space-x-4">
          <Link href="/auth/signin">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Register</Button>
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Open Opportunities</CardTitle>
            <CardDescription>0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mockups Pending</CardTitle>
            <CardDescription>0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Samples in Progress</CardTitle>
            <CardDescription>0</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uniform Orders in Progress</CardTitle>
            <CardDescription>0</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
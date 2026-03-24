'use client';

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VictoryPipelinePage() {
  // These values would be fetched from the API
  const pipeline = {
    prospects: 10,
    engaged: 6,
    mockupsPending: 3,
    samplesOut: 2,
    closing: 1,
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">My Victory Pipeline Today</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle>Prospects</CardTitle>
            <CardDescription>{pipeline.prospects}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Engaged</CardTitle>
            <CardDescription>{pipeline.engaged}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mockups Pending</CardTitle>
            <CardDescription>{pipeline.mockupsPending}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Samples Out</CardTitle>
            <CardDescription>{pipeline.samplesOut}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Closing</CardTitle>
            <CardDescription>{pipeline.closing}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

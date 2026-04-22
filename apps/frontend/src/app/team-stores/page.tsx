'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TeamStoresPage() {

  const handleImport = async () => {
    try {
      const response = await fetch('/api/v1/import-ecwid-orders', {
        method: 'POST',
      });

      if (response.ok) {
        // Handle successful import
        console.log('Ecwid orders imported successfully');
      } else {
        // Handle error
        console.error('Ecwid order import failed');
      }
    } catch (error) {
      console.error('An error occurred during Ecwid order import:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Team Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleImport}>Import Ecwid Orders</Button>
        </CardContent>
      </Card>
    </div>
  );
}

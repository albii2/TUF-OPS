'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RosterUploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Replace with your actual uniform_order_id
    const uniform_order_id = 1;

    try {
      const response = await fetch(`/api/v1/roster-uploads/${uniform_order_id}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Handle successful upload
        console.log('File uploaded successfully');
      } else {
        // Handle error
        console.error('File upload failed');
      }
    } catch (error) {
      console.error('An error occurred during file upload:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Roster Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input type="file" onChange={handleFileChange} />
            <Button onClick={handleUpload}>Upload</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

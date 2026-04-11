'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function RosterUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please choose a file first.')
      return
    }

    // Roster ingestion endpoint is planned for the next iteration.
    setMessage('Roster upload backend is not yet enabled. Order workflow foundation is now live.')
  }

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
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { toast } from "../ui/use-toast";
import { getApiBaseUrl, joinApiUrl } from "@/lib/api";

export function WhatsAppCsvUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      toast({ title: "Upload error", description: "API base URL missing", variant: "destructive" });
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(joinApiUrl(apiBaseUrl, "/whatsapp-csv/upload"), {
        method: "POST",
        body: formData,
        headers: {
          // Authorization header if needed
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Upload successful", description: `${data.results.length} notifications sent.` });
      } else {
        toast({ title: "Upload failed", description: data.detail || "Unknown error", variant: "destructive" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected upload error";
      toast({ title: "Upload error", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Bulk WhatsApp Notification (CSV)</h2>
      <Input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} disabled={uploading} />
      <Button className="mt-4" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload CSV"}
      </Button>
      <p className="text-sm text-gray-500 mt-2">CSV must have columns: <code>phone</code>, <code>message</code></p>
    </Card>
  );
}

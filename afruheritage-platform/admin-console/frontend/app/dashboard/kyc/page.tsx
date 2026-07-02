"use client";
import { useEffect, useState } from "react";
import { BackButton } from '@/components/back-button'
import { Button } from "@/components/ui/button";

export default function KycDashboardPage() {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/admin/kyc/list")
      .then((res) => res.json())
      .then((data) => {
        setKycList(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load KYC submissions");
        setLoading(false);
      });
  }, []);

  const handleAction = async (kycId, action) => {
    const url = `/admin/kyc/${action}/${kycId}`;
    const res = await fetch(url, { method: "POST" });
    if (res.ok) {
      setKycList((prev) =>
        prev.map((k) =>
          k.id === kycId ? { ...k, status: action === "approve" ? "approved" : "rejected" } : k
        )
      );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
  <>
    <BackButton />
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">KYC Submissions</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">User ID</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">ID Document</th>
            <th className="p-2 border">Liveness Video</th>
            <th className="p-2 border">Result</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {kycList.map((k) => (
            <tr key={k.id}>
              <td className="p-2 border">{k.user_id}</td>
              <td className="p-2 border">{k.status}</td>
              <td className="p-2 border">
                {k.id_document_url ? (
                  <a href={k.id_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                ) : (
                  "-"
                )}
              </td>
              <td className="p-2 border">
                {k.liveness_video_url ? (
                  <a href={k.liveness_video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                ) : (
                  "-"
                )}
              </td>
              <td className="p-2 border">{k.result || "-"}</td>
              <td className="p-2 border">
                {k.status === "pending" && (
                  <>
                    <Button className="mr-2" onClick={() => handleAction(k.id, "approve")}>Approve</Button>
                    <Button variant="destructive" onClick={() => handleAction(k.id, "revoke")}>Revoke</Button>
                  </>
                )}
                {k.status === "approved" && (
                  <Button variant="destructive" onClick={() => handleAction(k.id, "revoke")}>Revoke</Button>
                )}
                {k.status === "rejected" && (
                  <Button onClick={() => handleAction(k.id, "approve")}>Approve</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/countdown-timer";
import { Shield, ArrowLeft, Download, Copy, Check, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AccessSlotResponse } from "@shared/schema";
import { formatFileSize, formatSlotId } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OpenSlot() {
  const [slotId, setSlotId] = useState('');
  const [password, setPassword] = useState('');
  const [slotData, setSlotData] = useState<AccessSlotResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { toast } = useToast();

  const accessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/slot/${slotId}`, { password });
      return await response.json() as AccessSlotResponse;
    },
    onSuccess: (data) => {
      setSlotData(data);
      setFailedAttempts(0);
    },
    onError: (error: any) => {
      const attemptsRemaining = error?.message?.includes('attempts') 
        ? parseInt(error.message.match(/\d+/)?.[0] || '0')
        : 0;
      
      setFailedAttempts(3 - attemptsRemaining);
      
      toast({
        title: "Access Denied",
        description: error?.message || "Invalid slot ID or password",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/slot/${slotId}`, { password });
    },
    onSuccess: () => {
      toast({
        title: "Slot Deleted",
        description: "The slot and all files have been permanently deleted.",
      });
      setSlotData(null);
      setSlotId('');
      setPassword('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete slot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotId || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both slot ID and password",
        variant: "destructive",
      });
      return;
    }
    accessMutation.mutate();
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(`/api/download/${slotId}/${fileId}?password=${encodeURIComponent(password)}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const copyText = () => {
    if (slotData?.textContent?.content) {
      navigator.clipboard.writeText(slotData.textContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    }
  };

  const maxAttempts = 3;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold">SecureShare</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Open Secure Slot</h1>
            <p className="text-muted-foreground">
              Enter the slot ID and password to access shared files
            </p>
          </div>

          {!slotData && (
            <Card>
              <CardHeader>
                <CardTitle>Access Slot</CardTitle>
                <CardDescription>
                  Enter the credentials provided by the sender
                </CardDescription>
                {failedAttempts > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mt-4">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium" data-testid="text-failed-attempts">
                      {maxAttempts - failedAttempts} attempts remaining
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccess} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slotId">Slot ID</Label>
                    <Input
                      id="slotId"
                      type="text"
                      placeholder="123456789"
                      value={slotId}
                      onChange={(e) => setSlotId(e.target.value.replace(/\D/g, ''))}
                      required
                      data-testid="input-slot-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={accessMutation.isPending}
                    data-testid="button-access"
                  >
                    {accessMutation.isPending ? 'Accessing...' : 'Access Slot'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {slotData && slotData.slot && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Slot: {formatSlotId(slotId)}</CardTitle>
                      <CardDescription>Access granted successfully</CardDescription>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" data-testid="button-delete-slot">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Slot?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the slot and all files. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="pt-2">
                    <CountdownTimer expiresAt={slotData.slot.expiresAt} />
                  </div>
                </CardHeader>
              </Card>

              {slotData.files.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Files ({slotData.files.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {slotData.files.map((file, index) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                        data-testid={`file-item-${index}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" data-testid={`file-name-${index}`}>
                            {file.originalName}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`file-size-${index}`}>
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.originalName)}
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {slotData.textContent && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Text Content</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyText}
                        data-testid="button-copy-text"
                      >
                        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap break-words" data-testid="text-content">
                      {slotData.textContent.content}
                    </div>
                  </CardContent>
                </Card>
              )}

              {slotData.files.length === 0 && !slotData.textContent && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No files or text content in this slot</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

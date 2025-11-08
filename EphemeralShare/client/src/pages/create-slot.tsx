import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadZone } from "@/components/file-upload-zone";
import { CountdownTimer } from "@/components/countdown-timer";
import { Shield, Copy, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CreateSlotResponse } from "@shared/schema";
import { formatSlotId } from "@/lib/utils";

export default function CreateSlot() {
  const [step, setStep] = useState<'password' | 'upload' | 'success'>('password');
  const [password, setPassword] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState('');
  const [slotData, setSlotData] = useState<CreateSlotResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSlotMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/slot', { password });
      return await response.json() as CreateSlotResponse;
    },
    onSuccess: (data) => {
      setSlotData(data);
      setStep('upload');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create slot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { slotId: string; password: string; files: File[]; text: string }) => {
      const formData = new FormData();
      formData.append('password', data.password);
      
      data.files.forEach((file) => {
        formData.append('files', file);
      });

      if (data.text.trim()) {
        formData.append('text', data.text);
      }

      const response = await fetch(`/api/upload/${data.slotId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      setStep('success');
      toast({
        title: "Success",
        description: "Files and text uploaded successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 4 characters long.",
        variant: "destructive",
      });
      return;
    }
    createSlotMutation.mutate();
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotData) {
      toast({
        title: "Error",
        description: "No slot data available. Please try creating the slot again.",
        variant: "destructive",
      });
      return;
    }
    uploadMutation.mutate({
      slotId: slotData.slotId,
      password,
      files,
      text,
    });
  };

  const copySlotId = () => {
    if (slotData) {
      navigator.clipboard.writeText(slotData.slotId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Slot ID copied to clipboard",
      });
    }
  };

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
            <h1 className="text-3xl font-bold">Create Secure Slot</h1>
            <p className="text-muted-foreground">
              Set a password and upload files or text to share
            </p>
          </div>

          {step === 'password' && (
            <Card>
              <CardHeader>
                <CardTitle>Set Password</CardTitle>
                <CardDescription>
                  Create a password to protect your slot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSlot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={4}
                      data-testid="input-password"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum 4 characters
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createSlotMutation.isPending}
                    data-testid="button-create"
                  >
                    {createSlotMutation.isPending ? 'Creating...' : 'Create Slot'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'upload' && slotData && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Files & Text</CardTitle>
                <CardDescription>
                  Add files or text to your secure slot
                </CardDescription>
                <div className="pt-2">
                  <CountdownTimer expiresAt={slotData.expiresAt} />
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Files</Label>
                    <FileUploadZone
                      files={files}
                      onFilesChange={setFiles}
                      disabled={uploadMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text">Text Content (Optional)</Label>
                    <Textarea
                      id="text"
                      placeholder="Enter text to share..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      disabled={uploadMutation.isPending}
                      data-testid="input-text"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={uploadMutation.isPending || (files.length === 0 && !text.trim())}
                    data-testid="button-upload"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload & Complete'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 'success' && slotData && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-center">Slot Created Successfully!</CardTitle>
                <CardDescription className="text-center">
                  Share this ID and password with anyone you want to access your files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Slot ID</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 font-mono text-2xl font-bold bg-muted p-4 rounded-lg text-center" data-testid="text-slot-id">
                      {formatSlotId(slotData.slotId)}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copySlotId}
                      data-testid="button-copy"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="font-mono bg-muted p-4 rounded-lg text-center" data-testid="text-password">
                    {password}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <CountdownTimer expiresAt={slotData.expiresAt} />
                  <p className="text-sm text-muted-foreground mt-2">
                    All files and data will be permanently deleted after 24 hours
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <Link href="/">
                    <Button variant="outline" className="w-full" data-testid="button-home">
                      Back to Home
                    </Button>
                  </Link>
                  <Link href="/open">
                    <Button className="w-full" data-testid="button-open-slot">
                      Open This Slot
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

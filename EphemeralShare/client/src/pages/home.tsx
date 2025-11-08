import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, Lock, Clock, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">SecureShare</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/create">
              <Button variant="ghost" size="sm" data-testid="link-create-header">
                Create
              </Button>
            </Link>
            <Link href="/open">
              <Button variant="ghost" size="sm" data-testid="link-open-header">
                Open
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Share Files Securely
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Create temporary, password-protected slots to share files and text. 
              Everything auto-deletes after 24 hours. No tracking, no accounts required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/create">
              <Button 
                size="lg" 
                className="w-full sm:w-auto min-w-[200px] h-12 text-base"
                data-testid="button-create-slot"
              >
                <Upload className="mr-2 h-5 w-5" />
                Create Slot
              </Button>
            </Link>
            <Link href="/open">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto min-w-[200px] h-12 text-base"
                data-testid="button-open-slot"
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                Open Slot
              </Button>
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Password Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>24-Hour Auto-Delete</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>No Tracking</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 px-4">
        <div className="container text-center text-sm text-muted-foreground">
          Temporary file sharing with military-grade encryption
        </div>
      </footer>
    </div>
  );
}

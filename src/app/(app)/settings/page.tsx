"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createTag } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function SettingsPage() {
  const [tagName, setTagName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddTag = () => {
    if (!tagName.trim()) return;
    startTransition(async () => {
      try {
        await createTag(tagName);
        toast.success(`Tag "${tagName}" created`);
        setTagName("");
      } catch {
        toast.error("Failed to create tag");
      }
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. recurring, impulse"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
            <Button onClick={handleAddTag} size="icon" disabled={isPending || !tagName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            href="/account/settings"
            className="block rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
          >
            Profile Settings
          </Link>
          <Separator />
          <Link
            href="/account/security"
            className="block rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
          >
            Security
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

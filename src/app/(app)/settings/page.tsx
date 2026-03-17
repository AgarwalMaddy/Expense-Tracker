"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, User, Shield, ChevronRight, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { createTag } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const accountLinks = [
    { href: "/account/settings", label: "Profile Settings", icon: User, desc: "Manage your profile information" },
    { href: "/account/security", label: "Security", icon: Shield, desc: "Password and authentication" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mx-auto max-w-2xl space-y-5 p-4 md:p-8"
    >
      {/* Create Tag */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            Create Tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. recurring, impulse, needs"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              className="rounded-xl"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleAddTag}
                size="icon"
                disabled={isPending || !tagName.trim()}
                className="rounded-xl gradient-primary hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="overflow-hidden border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display font-semibold">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-2">
          {accountLinks.map(({ href, label, icon: Icon, desc }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/80 group-hover:bg-muted transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

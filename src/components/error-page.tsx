"use client";

import { redirect } from "next/navigation";
import { FrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: unknown;
}

export default function ErrorPage({ error }: ErrorPageProps) {
  const goBackToHomePage = () => {
    redirect("/");
  };

  return (
    <div className="bg-background flex h-full flex-col items-center justify-center text-xl">
      <div className="flex items-center gap-2 pb-4">
        <FrownIcon className="text-destructive" />
        <p className="text-destructive-foreground">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
      </div>

      <Button onClick={goBackToHomePage}>Go back to home page</Button>
    </div>
  );
}

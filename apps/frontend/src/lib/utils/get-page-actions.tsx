import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function getPageActions(pathname: string) {
  if (pathname === "/organizations") {
    return (
      <Link href="/organizations/new">
        <Button>Create Organization</Button>
      </Link>
    );
  }

  if (pathname === "/opportunities") {
    return (
      <Link href="/opportunities/new">
        <Button>Create Opportunity</Button>
      </Link>
    );
  }

  return null;
}

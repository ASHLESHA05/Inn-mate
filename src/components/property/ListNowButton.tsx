"use client";

import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

const ListNowButton = ({
  propertyId,
  kindeUserId,
}: {
  propertyId: string | undefined;
  kindeUserId: string | undefined;
}) => {
  const router = useRouter();
  return (
    <Button
      onClick={() => {
        router.push(`/user/${kindeUserId}/properties/${propertyId}/list`);
      }}
    >
      List Now
    </Button>
  );
};

export default ListNowButton;

export function EditProperty ({
  propertyId,
  kindeUserId,
}: {
  propertyId: string | undefined;
  kindeUserId: string | undefined;
})  {
  const router = useRouter();
  return (
    <Button
      onClick={() => {
        router.push(`/user/${kindeUserId}/edit-property/${propertyId}`);
      }}
    >
      Edit Property
    </Button>
  );
};


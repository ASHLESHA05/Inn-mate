import { mapKindeUserToUser } from "@/actions/userActions";
import AddPropertyForm from "@/components/property/AddPropertyForm";
import { TKindeUser } from "@/lib/definitions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

type Props = {
  params: Promise<{
    kindeUserId: string;
    propertyId: string;
  }>;
};

export default async function AddPropertyPage(props: Props) {
  const params = await props.params;
  const { kindeUserId, propertyId } = params; // Access both parameters here
  console.log(kindeUserId+'sdkncdsbbvh445@#$54f')
  const { getUser } = getKindeServerSession();
  const kindeUser = (await getUser()) as TKindeUser;
  const user = await mapKindeUserToUser(kindeUser);

  return <AddPropertyForm userId={user?.id} propId={propertyId} />;
}

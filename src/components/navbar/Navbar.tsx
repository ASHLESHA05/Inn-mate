// "use client";

import { ListPropertyButton } from "./ListPropertyButton";
import SearchBox from "./SearchBox";
import ProfileButton from "./ProfileButton";
import RegisterButton from "./RegisterButton";
import Link from "next/link";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { isUserHasProperties } from "@/actions/propertyActions";

export default async function Navbar() {
  // const { user, isAuthenticated } = useKindeBrowserClient();
  const { getUser, isAuthenticated } = getKindeServerSession();
  const user = await getUser();
  const isAuthenticatedUser = await isAuthenticated();
  console.log("user in navbar: ",user);

  //fetch is the user has any properties (isOwner)
  
  const res= await isUserHasProperties(user?.id)
  console.log("Is user has prop:",res)

  return (
    <nav className="flex flex-col w-full border-b-2 items-center mx-auto justify-between p-6 md:flex-row ">
      <Link href={"/"}>
        <h1 className="text-3xl font-bold left-6">INNMATE</h1>
      </Link>
      <SearchBox />
      <ListPropertyButton userId={user?.id} />
      {isAuthenticatedUser ? <ProfileButton isOwner={res? true: false} /> : <RegisterButton />}
    </nav>
  );
}

"use client";

import React from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// import { isUserHasProperties } from "@/actions/propertyActions";

interface ProfileButtonProps {
  isOwner: boolean;
}
const ProfileButton = ({isOwner} : ProfileButtonProps) => {
  const { user } = useKindeBrowserClient();
  if (!user) {
    return;
  }
  console.log(isOwner)
  

  const links = [
    { label: "My Bookings", link: `/bookings/${user.id}` },
    { label: "Edit Profile", link: `/additional-details` },
    { label: 'Favorites' , link : `/Favorites/${user.id}`},
    ...(isOwner ? [{ label: 'All Bookings', link: `/get-all-bookings/${user.id}` }] : []),
    ...(isOwner ? [{ label: 'Delete logs', link: `/user/${user.id}/delete-logs` }] : [])


  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-full" size="icon">
          {user.picture ? (
            <>
              <Image
                src={user.picture}
                alt="user-profile"
                width={34}
                height={34}
                className="rounded-full"
              />
              <span className="sr-only">Open user menu</span>
            </>
          ) : (
            <>
              <User className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Open user menu</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-4">
          <div className="font-medium">
            {user.given_name + " " + (user.family_name ? user.family_name : "")}
          </div>
          {links.map((link) => (
            <Link  key={link.label} href={link.link}>
              <Button
               
                variant="ghost"
                className="w-full justify-start"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          <LogoutLink>
            <Button variant="ghost" className="w-full justify-start">
              Log out
            </Button>
          </LogoutLink>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileButton;

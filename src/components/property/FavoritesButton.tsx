'use client';
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import addliked, { deleteLiked, getIsfavourite } from "@/actions/favouritesAction";
import { useForm } from "react-hook-form";
import { favouriteSchema, TFavourite } from "@/lib/definitions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getUserByKindeId } from "@/actions/userActions";

interface FavoriteButtonProps {
  propertyId: string;
}

export default function FavoriteButton({ propertyId }: FavoriteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const { user, isAuthenticated } = useKindeBrowserClient();
  const kindeId = user?.id || "";  

  const favorites = useForm<TFavourite>({
    resolver: zodResolver(favouriteSchema),
    defaultValues: { userId: "", propertyId: "" },
  });

  // Fetch user and set in form
  useEffect(() => {
    const fetchUser = async () => {
      if (!kindeId) return;

      const userRecord = await getUserByKindeId(kindeId);
      if (!userRecord || !userRecord.id) {
        console.error('User not found in DB');
        return;
      }

      favorites.setValue("userId", userRecord.id);

      // Now check if this property is already favorited
      if (propertyId) {
        const isFav = await getIsfavourite(userRecord.id, propertyId);
        setIsFavorited(!!isFav);
      }
    };

    fetchUser();
  }, [kindeId, propertyId, favorites]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({ title: "Error", description: "Please log in first" });
      router.push("/");
      return;
    }

    try {
      const formValues = favorites.getValues();
      const payload: TFavourite = { ...formValues, propertyId };

      if (isFavorited) {
        const result = await deleteLiked(payload);
        if (!result) throw new Error("Couldn't remove from favorites");
        setIsFavorited(false);
      } else {
        const result = await addliked(formValues.userId, payload);
        if (!result) throw new Error("Couldn't add to favorites");
        setIsFavorited(true);
      }

      router.refresh(); // Optional: refresh data if needed
    } catch (error) {
      console.error("Favorite toggle failed", error);
      toast({ title: "Error", description: "Error updating favorites" });
    }
  };

  return (
    <Button
      size="icon"
      variant="secondary"
      className="absolute top-2 right-2 rounded-full"
      onClick={handleToggleFavorite}
    >
      <Heart
        className="h-4 w-4"
        style={{
          fill: isFavorited ? "red" : "none",
          stroke: isFavorited ? "red" : "gray",
        }}
      />
      <span className="sr-only">Add to favorites</span>
    </Button>
  );
}

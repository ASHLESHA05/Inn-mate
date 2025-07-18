'use server'
import { favouriteSchema, TFavourite } from "@/lib/definitions";
import { getUserByKindeId, isAuthenticatedUserInDb } from "./userActions";
import prisma from "@/lib/db";
import cuid from "cuid";

export default async function addLiked(
  user_id: string,
  likedData: TFavourite
): Promise<string | null> {
  try {
    const isAuthenticatedUser = await isAuthenticatedUserInDb(user_id);
    if (!isAuthenticatedUser) {
      throw new Error("User not authenticated, please register before proceeding");
    }
    const validatedFavorites = favouriteSchema.parse(likedData);
    const id = cuid();

    // Call add_to_favourites function
    const result = await prisma.$queryRaw<any[]>`
      SELECT add_to_favourites(
          ${id},
          ${user_id},
          ${validatedFavorites.propertyId}
      )
    `;
    console.log("Favorites result:", result);

    if (result?.length > 0) {
      return result[0];
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error in adding favorites:', error.message);
    return null;
  }
}


export async function deleteLiked(likedData: TFavourite) {
  try {
    const validatedFavorites = favouriteSchema.parse(likedData);

    // Check if the favorite exists using raw SQL
    const favorite = await prisma.$queryRaw<TFavourite[]>`
      SELECT * FROM Favourite
      WHERE userId = ${validatedFavorites.userId}
        AND propertyId = ${validatedFavorites.propertyId};
    `;
    console.log("liked deleted")

    if (favorite.length === 0) {
      return null; // No favorite found to delete
    }

    // Delete the favorite using raw SQL
    await prisma.$queryRaw`
      DELETE FROM Favourite
      WHERE userId = ${validatedFavorites.userId} AND propertyId = ${validatedFavorites.propertyId};
    `;

    return { id: favorite[0].id }; // Return the ID of the deleted favorite
  } catch (error) {
    console.log('Error While deleting', error);
    return null;
  }
}



export async function getIsfavourite(userId: string, propertyId: string) {
  const favourite = await prisma.$queryRaw<TFavourite[]>`
    SELECT * FROM Favourite
    WHERE userId = ${userId} AND propertyId = ${propertyId}
    `;

  if (favourite.length > 0) {
    return favourite[0];
  } else {
    return null;
  }
}

export async function getAllfavourite(KindeId: string | ""): Promise<TFavourite[] | null> {
  const user_id = await getUserByKindeId(KindeId);
  if (!user_id) {
    console.error("User not found in the database.");
    return null;
  }

  if (!(await isAuthenticatedUserInDb(user_id?.id || ""))) {
    console.error("User not Authenticated");
    return null;
  }

  // Raw SQL query to get all favorites for a user
  const favourites = await prisma.$queryRaw<TFavourite[]>`
    SELECT * FROM Favourite
    WHERE userId = ${user_id.id};`;

  if (!favourites) {
    return null;
  }
  return favourites;
}

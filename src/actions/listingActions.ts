"use server";
import { listingSchema, TListing } from "@/lib/definitions";
import { isAuthenticatedUserInDb } from "./userActions";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import  cuid  from "cuid";  // Import cuid for generating unique IDs

export async function createListing(
  listingValues: TListing
): Promise<TListing | null> {
  try {

    const validatedListing = listingSchema.parse(listingValues);

    // Check if user exists
    const user = await isAuthenticatedUserInDb(validatedListing.userId);
    if (!user) {
      throw new Error("couldn't get the user");
    }

    //check if listing exists
    const result = await prisma.$queryRaw<TListing[]>`
      SELECT * FROM Listing WHERE userId = ${listingValues.userId} AND propertyId = ${listingValues.propertyId}
    `

    if (result.length > 0){
      throw new Error('Listing Already exists!!')
    }
    const newListingId = cuid(); 


  console.log(newListingId)
  const newListing : any= await prisma.$queryRaw`
    CALL insert_new_listing(${newListingId}, ${validatedListing.availabilityStart}, ${validatedListing.availabilityEnd}, ${validatedListing.userId}, ${validatedListing.propertyId});
  `;
    
    if (!newListing || newListing.length === 0) {
      throw new Error("couldn't create the listing");
    }

    // Revalidate path after insertion
    revalidatePath(`/user/${user.kindeId}/properties`);
    return newListing[0]; 
  } catch (error) {
    console.error("Error in creating the listing: ", error);
    return null;
  }
}




export async function getListing(
  userId?: string,
  propertyId?: string
): Promise<TListing | null> {
  try {
    if (!propertyId || !userId) {
      throw new Error("Couldn't get the user or property");
    }

    console.log("property, userId:", propertyId, userId);

    const listing = await prisma.$queryRaw<TListing[]>`
      SELECT * FROM Listing WHERE userId = ${userId} AND propertyId = ${propertyId}
    `;

    console.log("Listing in getListing: ", listing);

    if (listing.length === 0) return null;

    return listing[0];  // ✅ Return first item only
  } catch (error) {
    console.error("Error in finding the listing: ", error);
    return null;
  }
}

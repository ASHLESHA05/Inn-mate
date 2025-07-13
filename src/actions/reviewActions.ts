"use server";

import prisma from "@/lib/db";
import { reviewSchema, TReview } from "@/lib/definitions";
import cuid from "cuid";
import { z } from "zod";
import { getUserById } from './userActions';
import { revalidatePath } from 'next/cache';


export async function getAllReviewsById(
  propertyId: string
): Promise<Array<TReview & { name: string }> | null> {
  try {
    // Step 1: Fetch reviews with userId
    const reviews = await prisma.$queryRaw`
      SELECT * FROM Review WHERE propertyId = ${propertyId}
    `;

    // Step 2: Validate reviews using zod schema
    const reviewSchemaArray = z.array(reviewSchema);
    const validatedReviews = reviewSchemaArray.parse(reviews);

    // Step 3: Map through reviews and fetch user names
    const reviewsWithNames = await Promise.all(
      validatedReviews.map(async (review) => {
        const user = await getUserById(review.userId); // Fetch user by userId
        return {
          ...review,
          name: user ? user.name : '', // Add user name to review
        };
      })
    );

    return reviewsWithNames;
  } catch (error) {
    console.error("Error in getting reviews by property ID: ", error);
    return null;
  }
}



//If i give a review it has to get added to db
export async function AddReviews(
  data: TReview
){
  try{
    await prisma.$queryRaw`
      INSERT INTO Review(id,rating,comment,userId,propertyId,createdAt)
      values(${cuid()}, ${data.rating}, ${data.comment} ,${data.userId}, ${data.propertyId},${data.createdAt})
    `
    revalidatePath(`/properties/${data.propertyId}`)
    return 200
  }catch(error){
    console.log('Error Something went wrong.. :(',error)
    return null
  }
}

"use server";

import prisma from "@/lib/db";
import { locationSchema, TLocation } from "@/lib/definitions";

export async function getLocationById(
  locationId: string | undefined
): Promise<TLocation | null> {
  try {
    if (!locationId) {
      throw new Error("Couldn't get the locationId");
    }

    // Raw SQL query to get location by locationId
    const location = await prisma.$queryRaw<TLocation[]>`
      SELECT * FROM Location WHERE id = ${locationId};`;

    if (location.length === 0) {
      return null; // Return null if location not found
    }

    const validatedLocation = locationSchema.parse(location[0]);
    return validatedLocation;
  } catch (error) {
    console.error("Error in getting the locationById: ", error);
    return null;
  }
}

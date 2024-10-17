"use server";

import {
  imageSchema,
  locationSchema,
  propertySchema,
  TAddPropertyFormvaluesSchema,
  TImage,
  TProperty,
} from "@/lib/definitions";
import { getUserByKindeId, isAuthenticatedUserInDb } from "./userActions";
import prisma from "@/lib/db";
import { z } from "zod";
import { connect } from "http2";
import { getLocationById } from "./locationActions";
import { revalidatePath } from "next/cache";

export async function getAllPropertiesByUserId(
  userId: string
): Promise<TProperty[] | null> {
  try {
    const isUser = await isAuthenticatedUserInDb(userId);
    // if (!isUser) {
    //   return null;
    // }

    const properties = await prisma.property.findMany({
      where: { userId },
      //include: {amenities: true, }
    });
    const propertiesSchemaArray = z.array(propertySchema);
    const validatedProperties = propertiesSchemaArray.parse(properties);
    return validatedProperties;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}

export async function getAllImagesbyId(
  propertyId: string
): Promise<TImage[] | null> {
  try {
    const images = await prisma.image.findMany({
      where: {
        propertyId,
      },
    });
    const imagesSchemaArray = z.array(imageSchema);
    const validatedImages = imagesSchemaArray.parse(images);
    return validatedImages;
  } catch (error) {
    console.error("Error in getting images: ", error);
    return null;
  }
}

export async function addProperty(
  kindeId: string,
  propertyData: TAddPropertyFormvaluesSchema
): Promise<TProperty | null> {
  try {
    const user = await getUserByKindeId(kindeId);
    if (!user || !user.id) {
      throw new Error(`couldn't find the user with kindeID ${kindeId}`);
    }
    const isAuthenticatedUser = await isAuthenticatedUserInDb(user.id);
    if (!isAuthenticatedUser) {
      throw new Error(
        "User not authenticated, please register before proceeding"
      );
    }
    const validatedLocation = locationSchema.parse(propertyData);
    const validatedProperty = propertySchema.parse(propertyData);

    // check if the location already exists

    let location = await prisma.location.findFirst({
      where: {
        city: validatedLocation.city,
        country: validatedLocation.country,
        state: validatedLocation.state,
      },
    });
    if (!location) {
      location = await prisma.location.create({
        data: {
          ...validatedLocation,
        },
      });
    }

    const isHotel = validatedProperty.propertyType === "Hotel";

    const property = await prisma.property.create({
      data: {
        ...validatedProperty,
        isHotel,
        userId: user.id,
        locationId: location.id,
      },
    });
    revalidatePath(`/user/${kindeId}/properties`);
    return property;
  } catch (error) {
    console.error("Error in adding the property: ", error);
    return null;
  }
}

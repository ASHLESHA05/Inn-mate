"use server";

import {
  amenitySchema,
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
import { getLocationById } from "./locationActions";
import { revalidatePath } from "next/cache";

const UPLOADCARE_PUBLIC_KEY = 'ecc593f3433cbf4e6114'; // Replace with your Uploadcare public key
const UPLOADCARE_SECRET_KEY = process.env.UPLOADCARE_SECRET_KEY!
import {
  deleteFile,
  UploadcareSimpleAuthSchema,
} from '@uploadcare/rest-client';
import { PropertyType } from "@prisma/client";


const uploadcareSimpleAuthSchema = new UploadcareSimpleAuthSchema({
  publicKey: UPLOADCARE_PUBLIC_KEY,
  secretKey :UPLOADCARE_SECRET_KEY,

});

//========================================================================================================================================
export async function getAllListedProperties(): Promise<TProperty[] | null> {
  try {
    // Ensure correct JOIN condition (assuming `l.propertyId` exists in `listing` table)
    const listings = await prisma.$queryRaw<TProperty[]>`
      SELECT p.*, l.availabilityStart, l.availabilityEnd 
      FROM listing AS l
      JOIN property AS p ON p.id = l.propertyId
      LIMIT 20
    `;

    const propertiesSchemaArray = z.array(propertySchema);
    console.log("listings",listings)
    const validatedProperties = propertiesSchemaArray.parse(
      listings.map((listing) => listing)
    );
    console.log("Validated properties:", validatedProperties);

    return validatedProperties;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}
//============================================================================================================================================
import { Prisma } from "@prisma/client";
import cuid from "cuid";

export async function getFilteredListings(
  destination?: string,
  checkIn?: string,
  checkOut?: string,
  type?: string
): Promise<TProperty[] | null> {
  try {
    const propertyTypeValue = type
      ? PropertyType[type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() as keyof typeof PropertyType]
      : undefined;

    // Build the query string and dynamically add parameters
    const query = Prisma.sql`
      SELECT p.*, l.availabilityStart, l.availabilityEnd
      FROM listing AS l
      JOIN property AS p ON p.id = l.propertyId
      WHERE 1=1
      ${destination ? Prisma.sql`AND match_destination(p.name, p.description, p.city, p.state, p.country, ${destination})` : Prisma.empty}
      ${checkIn && checkOut ? Prisma.sql`AND l.availabilityStart <= ${new Date(checkIn)} AND l.availabilityEnd >= ${new Date(checkOut)}` : Prisma.empty}
      ${propertyTypeValue ? Prisma.sql`AND p.propertyType = ${propertyTypeValue}` : Prisma.empty}
      LIMIT 20;
    `;

    const filteredListings = await prisma.$queryRaw<TProperty[]>(query);

    const propertiesSchemaArray = z.array(propertySchema);
    const validatedProperties = propertiesSchemaArray.parse(
      filteredListings.map((listing) => listing)
    );

    if (!validatedProperties) {
      return null;
    }

    return validatedProperties;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}



//============================================================================================================================================

export async function getAllPropertiesByUserId(
  userId: string
): Promise<TProperty[] | null> {
  try {
    // const isUser = await isAuthenticatedUserInDb(userId);
    // if (!isUser) {
    //   return null;
    // }

    const properties = await prisma.property.findMany({
      where: { userId },
      include: {
        // amenities: true,
        // bookings: true,
        // favourites: true,
        // images: true,
        // listings: true,
        // location: true,
        // reviews: true,
        // rooms: true,
        // user: true,
      },
    });
    const propertiesSchemaArray = z.array(propertySchema);
    const validatedProperties = propertiesSchemaArray.parse(properties);
    return validatedProperties;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}
//============================================================================================================================================
export async function getPropertyById(
  propertyId: string
): Promise<TProperty | null> {
  try {
    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });
    const validatedProperty = propertySchema.parse(property);
    return validatedProperty;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}



//============================================================================================================================================
export async function addProperty(
  kindeId: string,
  propertyData: TAddPropertyFormvaluesSchema
): Promise<TProperty | null> {
  try {
    const user = await getUserByKindeId(kindeId);
    if (!user || !user.id) {
      throw new Error(`Couldn't find the user with kindeID ${kindeId}`);
    }

    const isAuthenticatedUser = await isAuthenticatedUserInDb(user.id);
    if (!isAuthenticatedUser) {
      throw new Error("User not authenticated, please register before proceeding");
    }

    // Normalize and validate input data
    const normalizedPropertyData = {
      ...propertyData,
      country: propertyData.country?.toLowerCase(),
      state: propertyData.state?.toLowerCase(),
      city: propertyData.city?.toLowerCase(),
      images: propertyData.images || [],
      amenities: propertyData.amenities || [],
    };

    // Validate data with schemas
    const validatedLocation = locationSchema.parse(normalizedPropertyData);
    const validatedProperty = propertySchema.parse(normalizedPropertyData);
    const validatedImages = normalizedPropertyData.images.map((image) => ({
      ...image,
      imageId: cuid(), // Generate cuid for each image
    }));
    const validatedAmenities = normalizedPropertyData.amenities.map((amenity) => ({
      ...amenity,
      amenityId: cuid(), // Generate cuid for each amenity
    }));

    // Validate and stringify
    const validatedImagesJson = JSON.stringify(validatedImages);
    const validatedAmenitiesJson = JSON.stringify(validatedAmenities);

    // Call stored procedure to insert data
    const result: TProperty = await prisma.$queryRaw`
      CALL AddProperty(
        ${cuid()},
        ${user.id},
        ${validatedProperty.name},
        ${validatedProperty.description},
        ${false},
        ${validatedProperty.pricePerNight},
        ${validatedProperty.maxGuests},
        ${new Date()},

        ${validatedLocation.country},
        ${validatedLocation.state},
        ${validatedLocation.city},
        ${validatedProperty.propertyType},
        ${validatedProperty.RoomType ?? 'N/A'},
        ${validatedProperty.propertyType === 'Hotel'},

        --Now there is error here ..just rectify it 
        ${validatedImagesJson},
        ${validatedAmenitiesJson}
      )
    `;

    // Revalidate paths (if applicable)
    revalidatePath(`/user/${kindeId}/properties`);
    revalidatePath("/");
    return result;
  } catch (error) {
    console.error("Error in adding the property: ", error);
    return null;
  }
}

//============================================================================================================================================

export async function updateProperty(
  kindeId: string,
  propertyId: string,
  propertyData: TAddPropertyFormvaluesSchema
): Promise<TProperty | null> {
  try {
    const user = await getUserByKindeId(kindeId);
    if (!user || !user.id) {
      throw new Error(`Couldn't find the user with kindeID ${kindeId}`);
    }

    const isAuthenticatedUser = await isAuthenticatedUserInDb(user.id);
    if (!isAuthenticatedUser) {
      throw new Error(
        "User not authenticated, please register before proceeding"
      );
    }
    console.log("PropData: ",propertyData)
    const imagesSchemaArray = z.array(imageSchema);
    const validatedLocation = locationSchema.parse(propertyData);
    const validatedProperty = propertySchema.parse(propertyData);
    const validatedImages = imagesSchemaArray.parse(propertyData.image);

    // Check if the property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!existingProperty) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }

    // Check if the location already exists
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

    // Update the property in the database'5
    console.log("Validated images: ",validatedImages)
    const property = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...validatedProperty,
        isHotel,
        locationId: location.id,
        images: {
          deleteMany: {}, // Optionally delete old images if necessary
          create: validatedImages.map((image) => ({
            link: image.link,
          })),
        },
        ...(isHotel && {
          RoomType: validatedProperty.RoomType
        })
        ,
      },
    });

    return property;
  } catch (error) {
    console.error("Error in updating the property: ", error);
    return null;
  }
}

//============================================================================================================================================
export async function Delete_UploadCare(urlToDelete : string){
  try {
    // Delete the image from Uploadcare
    const result = await deleteFile(
      {
        uuid: urlToDelete,
      },
      { authSchema: uploadcareSimpleAuthSchema }
    )
    if(result.metadata){
      return 200
    }
    else{
      return 400
    }
    
}
catch (error) {
    console.error('Error deleting image from Uploadcare:', error);
  }

  
}
//============================================================================================================================================

export async function getAllImagesbyId(
  propertyId: string | undefined
): Promise<TImage[] | null> {
  try {
    if (!propertyId) {
      throw new Error("couldn't get the property");
    }

    // Raw SQL query to fetch images based on propertyId
    const images = await prisma.$queryRaw<TImage[]>`
      SELECT * FROM image WHERE propertyId = ${propertyId}
    `;

    // Assuming the imageSchema validates the result structure
    const imagesSchemaArray = z.array(imageSchema);
    const validatedImages = imagesSchemaArray.parse(images);
    
    return validatedImages;
  } catch (error) {
    console.error("Error in getting images: ", error);
    return null;
  }
}


//============================================================================================================================================
export async function DeletePropertyByIdAdmin(propertyId: string) {
  try {
    // Raw SQL query to delete a property by its ID
    const result = await prisma.$queryRaw`
      DELETE FROM property WHERE id = ${propertyId}
    `;

    // Check if a row was affected
    if (result) {
      return result;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in deleting property:", error);
    return null;
  }
}

//============================================================================================================================================
export async function updatePropertyDelete(
  kindeId: string,
  propertyId: string,
  isDelete: boolean
): Promise<TProperty | null> {
  try {
    const user = await getUserByKindeId(kindeId);
    if (!user || !user.id) {
      throw new Error(`Couldn't find the user with kindeID ${kindeId}`);
    }

    const isAuthenticatedUser = await isAuthenticatedUserInDb(user.id);
    if (!isAuthenticatedUser) {
      throw new Error(
        "User not authenticated, please register before proceeding"
      );
    }

    // Check if the property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!existingProperty) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }

    // Update the property with raw SQL query
    const updatedProperty = await prisma.$executeRaw`
      UPDATE property
      SET isDeleted = ${isDelete}
      WHERE id = ${propertyId}
    `;

    if (updatedProperty) {
      // Optionally, query the property after update to return the full record
      const property = await prisma.property.findUnique({
        where: {
          id: propertyId,
        },
      });

      return property;
    }

    return null;
  } catch (error) {
    console.error("Error in updating the property: ", error);
    return null;
  }
}

//============================================================================================================================================
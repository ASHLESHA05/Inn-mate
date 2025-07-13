
"use server";
import {
  imageSchema,
  locationSchema,
  propertySchema,
  TAddPropertyFormvaluesSchema,
  TImage,
  TLocation,
  TProperty,
} from "@/lib/definitions";
import { getUserByKindeId, isAuthenticatedUserInDb } from "./userActions";
import prisma from "@/lib/db";
import { z } from "zod";
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

    const listings = await prisma.$queryRaw<TProperty[]>`
      SELECT p.*, l.availabilityStart, l.availabilityEnd 
      FROM Listing AS l
      JOIN Property AS p ON p.id = l.propertyId
      LIMIT 20
    `;


console.log("Validated props: ",listings)
    const propertiesSchemaArray = z.array(propertySchema);
    const validatedProperties = propertiesSchemaArray.parse(
      listings.map((listing) => listing)
    );
    return validatedProperties;
  } catch (error) {
    console.error("Error in getting properties: ", error);
    return null;
  }
}
//============================================================================================================================================
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
    const query = `
    SELECT p.*, l.availabilityStart, l.availabilityEnd
    FROM Listing AS l
    JOIN Property AS p ON p.id = l.propertyId
    JOIN Location as loc ON loc.id= p.locationId
    WHERE 1=1
    ${destination ? "AND CONCAT_WS(' ', p.name, p.description, loc.city, loc.state, loc.country) LIKE ?" : ""}
    ${checkIn && checkOut ? "AND l.availabilityStart <= ? AND l.availabilityEnd >= ?" : ""}
    ${propertyTypeValue ? "AND p.propertyType = ?" : ""}
    LIMIT 20;
  `;
  
  const queryParams = [
    ...(destination ? [`%${destination}%`] : []),
    ...(checkIn && checkOut ? [new Date(checkIn), new Date(checkOut)] : []),
    ...(propertyTypeValue ? [propertyTypeValue] : [])
  ];
  
  const filteredListings = await prisma.$queryRawUnsafe<TProperty[]>(query, ...queryParams);
  
    const propertiesSchemaArray = z.array(propertySchema);
    const validatedProperties = propertiesSchemaArray.parse(
      filteredListings.map((listing: any) => listing)
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

    const properties = await prisma.$queryRaw`
      SELECT * from Property where userId=${userId}
`

    console.log("ho",properties)
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
    const properties = await prisma.$queryRaw<TProperty[]>`
      SELECT * FROM Property WHERE id = ${propertyId}
    `;

    
    if (properties.length === 0) {
      return null;
    }
    console.log("IngetProp",properties)
    const property = properties[0];
    const validatedProperty = propertySchema.parse(property);
    console.log("IngetPropValidated",properties)
    return validatedProperty;
  } catch (error) {
    console.error("Error in getting property by ID: ", error);
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
    const normalizedPropertyData = {
      ...propertyData,
      country: propertyData.country?.toLowerCase(),
      state: propertyData.state?.toLowerCase(),
      city: propertyData.city?.toLowerCase(),
      images: propertyData.images || [],  // Default to empty array if no images
      amenities: propertyData.amenities || [],  // Default to empty array if no amenities
    };
    const validatedLocation = locationSchema.parse(normalizedPropertyData);
    const validatedProperty = propertySchema.parse(normalizedPropertyData);
    const validatedImages = normalizedPropertyData.images
      .filter(image => image.link && image.link.trim() !== '')  // Ensure valid link
      .map(image => ({
        ...image,
        imageId: cuid(), // Generate cuid for each image
      }));
    // Validate and stringify
    const validatedImagesJson = JSON.stringify(validatedImages);
    const validatedAmenitiesJson = JSON.stringify(normalizedPropertyData.amenities);
    const propertyId = await cuid();
    const locationId = await cuid();
    const RoomType = validatedProperty.RoomType ?? 'N/A'
    const isHotel = validatedProperty.propertyType === 'Hotel'


    const result = await prisma.$queryRaw<TProperty>`
      CALL AddProperty(
        ${propertyId},
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
        ${RoomType},
        ${isHotel},
        ${validatedImagesJson},
        ${validatedAmenitiesJson},
        ${locationId}
      )
    `;
    // querry= ' CALL AddProperty(%s,%s,%s),vales)
/*
    const result : TProperty = await prisma.$queryRawUnsafe(`
        CALL AddProperty(
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`,
          propertyId,
          user.id,
          validatedProperty.name,
          validatedProperty.description,
          false,
          validatedProperty.pricePerNight,
          validatedProperty.maxGuests,
          new Date(),
          validatedLocation.country,
          validatedLocation.state,
          validatedLocation.city,
          validatedProperty.propertyType,
          RoomType,
          isHotel,
          validatedImagesJson,
          validatedAmenitiesJson,
          locationId,
      )
*/
    
    // Revalidate paths (if applicable)
    revalidatePath(`/user/${kindeId}/properties`);
    revalidatePath("/");

    return result;
  } catch (error) {
    console.error("Error in adding the property: here", error);
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
    const validatedImages = imagesSchemaArray.parse(propertyData.images);

    // Check if the property exists
    const existingProperty = await prisma.$queryRaw<TProperty>`
      SELECT * FROM Property WHERE id=${propertyId}
    `
    if (!existingProperty) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }

    // Check if the location already exists

    const locations = await prisma.$queryRaw<TLocation[]>`
      SELECT * FROM Location WHERE
        city = ${validatedLocation.city} AND
        country= ${validatedLocation.country} AND 
        state = ${validatedLocation.state}
    `
    let location= locations[0]
    if (!location) {
      location = await prisma.location.create({
        data: {
          ...validatedLocation,
        },
      });
    }
    const isHotel = validatedProperty.propertyType === "Hotel";

    await prisma.$queryRaw`
      UPDATE Property 
      SET 
          name = ${validatedProperty.name},
          description = ${validatedProperty.description},
          pricePerNight = ${validatedProperty.pricePerNight},
          maxGuests = ${validatedProperty.maxGuests},
          PropertyType = ${validatedProperty.propertyType},
          UpdatedAt = ${new Date()},
          locationId = ${location.id},
          isHotel = ${isHotel},
          RoomType = ${isHotel ? `${validatedProperty.RoomType}` : 'N/A'}
      WHERE id = ${propertyId}
    `;

    await prisma.$queryRaw`
    DELETE FROM Image WHERE propertyId = ${propertyId};
    `

    for (const image of validatedImages) {
      await prisma.$queryRaw`
        INSERT INTO Image (id, propertyId, link) VALUES (${cuid()}, ${propertyId}, ${image.link})
      `;
    }
    

    // Fetch and return the updated property
      const property: any = await prisma.$queryRaw<TProperty[]>`
      SELECT 
        p.*, 
        l.city, 
        l.country, 
        l.state, 
        GROUP_CONCAT(i.link) AS image_links
      FROM Property p
        JOIN Location l ON p.locationId = l.id 
        LEFT JOIN Image i ON i.propertyId = p.id
      WHERE p.id = ${propertyId}
      GROUP BY p.id, l.city, l.country, l.state
    `;
    
    // After fetching, format the `image_links` field into an array
    const formattedProperty : TProperty= property.map((prop: any) => ({
      ...prop,
      images: prop.image_links ? prop.image_links.split(',').map((link: string) => ({ link })) : []
    })); // Assuming only one property is fetched
    
    console.log(formattedProperty);
  


    return formattedProperty;
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
      SELECT * FROM Image WHERE propertyId = ${propertyId}
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
      UPDATE Property
      SET isDeleted = ${isDelete}
      WHERE id = ${propertyId}
    `;

    if (updatedProperty) {
      // Optionally, query the property after update to return the full record
      const property : TProperty = await prisma.$queryRaw`
        SELECT * FROM Property WHERE id=${propertyId}
      `

      return property;
    }

    return null;
  } catch (error) {
    console.error("Error in updating the property: ", error);
    return null;
  }
}

//============================================================================================================================================

export async function isUserHasProperties(kindId: string) {
  console.log("isUserHasProperties");
  const userId = await getUserByKindeId(kindId)
  console.log("UserId: ",userId)

  const res= await prisma.$queryRaw<TProperty[]>`
    SELECT P.* FROM Property as P WHERE P.userId = ${userId?.id} 
  `
  console.log("Result: ",res)
  if(res && res.length > 0){
    return res
  }


  return null;
}


export async function AllBookingPropertyDetails(userId: string){
    //Here we fetch all the details like 
    /*
    1.PropertyID
    2.Property Name
    3.BookingID
    4.Booked User Name
    5.Price
    6.BookedOn
    7.Remaining Space
    8.CheckIn date
    9.checkOut date
    10.status
    */
    const res : any[] =await prisma.$queryRaw`
        SELECT 
          p.id AS propertyId,
          p.name AS PropertyName,
          b.id AS bookingID,
          u.name AS BookedUser,
          u.email AS BookedUserEmail,
          b.totalprice,
          b.updatedAt,
          b.roomId,
          b.status,
          r.avg_rating AS review
        FROM Property AS p
        JOIN Booking AS b ON b.propertyId = p.id
        JOIN User AS u ON u.id = b.userId
        LEFT JOIN (
            SELECT propertyId, AVG(rating) AS avg_rating
            FROM Review
            GROUP BY propertyId
        ) AS r ON r.propertyId = p.id
        WHERE p.userId = ${userId}
        ORDER BY avg_rating;
      `;

      console.log("ALL Prop Details" ,res)

      if(res && res.length >0 ){
        return res
      }

}


export async function getDeleteProplogs(userId: string) {
  const res: any[] = await prisma.$queryRaw`
    SELECT *
    FROM Deletion_log as dl
    WHERE dl.userId = ${userId} COLLATE utf8mb4_unicode_ci
  `;
  console.log("Result:Deleted",res)
  
  return res.length > 0 ? res : null;
}



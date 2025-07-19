import { getAllAmenitiesForProperty } from "@/actions/amenitiesAction";
import { getLocationById } from "@/actions/locationActions";
import {
  getAllImagesbyId,
  getAllListedProperties,
  getFilteredListings,
} from "@/actions/propertyActions";
import { getAllReviewsById } from "@/actions/reviewActions";
import { getUserById } from "@/actions/userActions";
import PropertyCard from "@/components/property/Property";
import { TKindeUser } from "@/lib/definitions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import PropTypesSelect from "@/components/propertyTypes/propTypes";
import Footer from "@/components/footer/footer";
import AboutUs from "@/components/contents/Aboutus";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  // Helper to extract query parameters
  const getParam = (key: string): string | undefined => {
    const value = resolvedParams?.[key];
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return value?.trim() || undefined;
  };

  // Format date to YYYY-MM-DD or return undefined
  const toDateStringOrUndefined = (value?: string): string | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString().split("T")[0];
  };

  const destination = getParam("dest");
  const checkIn = toDateStringOrUndefined(getParam("ci"));
  const checkOut = toDateStringOrUndefined(getParam("co"));
  const typeParam = getParam("type");
  const type = typeParam && typeParam !== "Any" ? typeParam : undefined;

  // Fetch authenticated user (optional)
  let kindeUser: TKindeUser | null = null;
  try {
    const { getUser } = getKindeServerSession();
    kindeUser = (await getUser()) as TKindeUser;
    console.log("User:", kindeUser);
  } catch (error) {
    console.warn("Failed to fetch user:", error);
  }

  // Get property listings based on filters (if any)
  const properties = destination || checkIn || checkOut || type
    ? await getFilteredListings(destination, checkIn, checkOut, type)
    : await getAllListedProperties();

  // Prepare property cards
  if (!properties){
    return <h1>No prop available</h1>
  }
  const propertyCards = await Promise.all(
    properties.map(async (property) => {
      if (!property?.id || !property?.locationId) {
        console.warn("Skipping property with missing ID or location:", property);
        return null;
      }

      try {
        const [reviews, amenities, images, location, user] = await Promise.all([
          getAllReviewsById(property.id),
          getAllAmenitiesForProperty(property.id),
          getAllImagesbyId(property.id),
          getLocationById(property.locationId),
          getUserById(property.userId),
        ]);

        if (!location || !amenities || !user) {
          console.error("Incomplete data for property:", property.id);
          return null;
        }

        return (
          <PropertyCard
            key={property.id}
            property={property}
            location={location}
            reviews={reviews}
            amenities={amenities}
            images={images}
            type="book"
            hostName={user.name}
            hostKindeId={property.userId}
            favorites=""
            status={null}
          />
        );
      } catch (error) {
        console.error("Failed to fetch property details:", property.id, error);
        return null;
      }
    })
  );

  const validCards = propertyCards.filter(Boolean);

  return (
    <>
      <PropTypesSelect />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 min-h-[50vh]">
        {validCards.length > 0 ? (
          validCards
        ) : (
          <div className="text-red-600 text-center font-semibold text-lg w-full mt-8 col-span-full">
            No property available
          </div>
        )}
      </div>

      <AboutUs />
      <Footer />
    </>
  );
}

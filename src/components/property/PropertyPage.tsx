"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Wifi,
  Coffee,
  WashingMachine,
  AirVent,
  Shrub,
  Waves,
  Dumbbell,
  CarFront,
  Microwave,
  Tv2,
  Dog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DateRangePicker from "@/components/property/DateRangePicker";
import { DateRange } from "react-day-picker";
import {
  TAmenity,
  TImage,
  TLocation,
  TProperty,
  TReview,
  TUser,
} from "@/lib/definitions";

// Mock data (replace with actual data fetching in a real application)
const property = {
  id: "1",
  name: "Luxurious Beachfront Villa",
  description:
    "Experience the ultimate beachfront luxury in this stunning villa. Enjoy breathtaking ocean views, private beach access, and world-class amenities.",
  pricePerNight: 500,
  maxGuests: 8,
  propertyType: "VILLA",
  isHotel: false,
  location: {
    city: "Malibu",
    state: "California",
    country: "United States",
  },
  images: [
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
    "/placeholder.svg?height=600&width=800",
  ],
  amenities: ["Wifi", "TV", "Parking", "Kitchen", "Coffee maker"],
  rating: 4.9,
  reviewCount: 128,
};

export default function PropertyListingPage({
  property,
  location,
  amenities,
  reviews,
  images,
  host,
}: {
  property: TProperty;
  location: TLocation;
  amenities: TAmenity[] | null;
  reviews: TReview[] | null;
  images: TImage[] | null;
  host: TUser;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const findAverageRating = (reviews: TReview[]): number | undefined => {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / reviews.length;

    return average;
  };

  const amenityIcons: { [key: string]: React.ElementType } = {
    WIFI: Wifi,
    PARKING: CarFront,
    AIR_CONDITIONING: AirVent,
    COFFEE: Coffee,
    PARK: Shrub,
    POOL: Waves,
    GYM: Dumbbell,
    KITCHEN: Microwave,
    TV: Tv2,
    LAUNDRY: WashingMachine,
    PET_FRIENDLY: Dog,
  };

  const handleDateSave = (dates: DateRange | undefined) => {
    // Handle the saved dates (e.g., update state, make API call, etc.)
    console.log("Selected dates:", dates);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh]">
        <Image
          src={images[currentImageIndex].link}
          alt={`${property.name} - Image ${currentImageIndex + 1}`}
          layout="fill"
          objectFit="cover"
          priority
        />
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80"
          onClick={prevImage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80"
          onClick={nextImage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === currentImageIndex ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-400 mr-1" />
              <span className="font-semibold">
                {findAverageRating(reviews) ?? ""}
              </span>
              <span className="text-muted-foreground ml-1">
                ({reviews.length} reviews)
              </span>
              <span className="mx-2">•</span>
              <span className="text-muted-foreground">
                {location.city}, {location.state}, {location.country}
              </span>
            </div>
            <p className="text-muted-foreground mb-6">{property.description}</p>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Type</h3>
                    <p>{property.propertyType}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Max Guests</h3>
                    <p>{property.maxGuests}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Price per Night</h3>
                    <p>${property.pricePerNight}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Hotel</h3>
                    <p>{property.isHotel ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity.name]; // Get the corresponding icon
                    return (
                      <div key={amenity.id} className="flex items-center">
                        {Icon && <Icon className="h-5 w-5 mr-2" />}{" "}
                        {/* Render the icon if it exists */}
                        <span>{amenity.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Check Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <DateRangePicker
                  availabilityStart={new Date()}
                  availabilityEnd={
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  }
                  onSave={handleDateSave}
                />
                <Button className="w-full mt-4">Reserve</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

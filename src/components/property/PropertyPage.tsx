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
  Bed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DateRangePicker from "@/components/property/DateRangePicker";
import { DateRange } from "react-day-picker";
import {
  TAmenity,
  TBooking,
  TImage,
  TListing,
  TLocation,
  TProperty,
  TReview,
  TUser,
} from "@/lib/definitions";

// import { createBooking } from "@/actions/bookingActions";
import { useToast } from "@/hooks/use-toast";
import ReviewCard from "./ReviewCard";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { loadStripe } from "@stripe/stripe-js";
import GuestPicker from "./GuestPicker";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Switch } from "@radix-ui/react-switch";
import { is_available } from "@/actions/bookingActions";

export default function PropertyListingPage({
  property,
  location,
  amenities,
  reviews,
  image,
  host,
  listing,
  bookings,
  userId,
}: {

  property: TProperty;
  location: TLocation;
  amenities: TAmenity[] | null;
  reviews: TReview[] | null;
  image: TImage[] | null;
  host: TUser;
  listing: TListing;
  bookings: TBooking[] | null;
  userId: string;
}) {
  // const router = useRouter()
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDates, setSelectedDates] = useState<DateRange>();
  const [isSelectedDates, setIsSelectedDates] = useState(false);
  const [isReserved, setisReserved] = useState(false)
  const [reservationDetails, setreservationDetails] = useState<TBooking>();
  const [showDialog, setShowDialog] = useState(false);
  const [getAdult, setAdults] = useState(1)
  const [getChild, setChild] = useState(0)
  const [isShared, setIsShared] = useState<boolean>(false); // Track if the property is shared
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Modal visibility
  const [confirmShare, setConfirmShare] = useState<boolean>(false); // Confirm share action
  const [totalRooms, setTotalRooms] = useState<number>(1);

  console.log(isReserved)
  console.log("isShared: ",isShared)
  const { toast } = useToast();

  const { user: kindeUser } = useKindeBrowserClient();

  if (!property.id || !host || !kindeUser) {
    return <>Sorry this property does not exist</>;
  }
  const displayedImages =
    image && image.length > 0
      ? image
      : [
        {
          id: "default1",
          propertyId: property.id,
          link: "https://images.unsplash.com/photo-1579297206620-c410c4af42e4?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
        {
          id: "default2",
          propertyId: property.id,
          link: "https://images.unsplash.com/photo-1579297206620-c410c4af42e4?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        },
      ];

  const nextImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % displayedImages.length
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex - 1 + displayedImages.length) % displayedImages.length
    );
  };

  const findAverageRating = (reviews: TReview[] | null): number => {
    if (!reviews || reviews.length === 0) {
      return -1;
    }
    console.log("reviews: ", reviews[0].rating);
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
  const check_availability= async()=>{
     const from=selectedDates?.from ?? new Date()
     const to=selectedDates?.to ?? new Date()
     const isavailabe=await is_available(from,to,property.id??"")
     if (isavailabe){
      return true
     }
     return false
  }

  const handleSubmit = async () => {

    try {
      if (
        !host.id ||
        !property.id ||
        !selectedDates?.from ||
        !selectedDates.to
      ) {
        throw new Error("couldn't get all the booking details");
      }
      const msInDay = 1000 * 60 * 60 * 24;
      const totalDays = Math.ceil(
        (selectedDates.to.getTime() - selectedDates.from.getTime()) / msInDay
      )

      const total_price_ = isShared
  ? (
      ((getAdult / property.maxGuests) +
      (0.5 * getChild / property.maxGuests)) *
      1.2 // Add 20% surcharge for shared spaces
    ) * totalDays*property.pricePerNight
  : property.isHotel
    ? property.pricePerNight * totalDays * totalRooms
    : property.pricePerNight * totalDays;

      const bookingValues: TBooking & { isShared: boolean ,Numberofrooms: number | null } = {
        userId,
        propertyId: property.id,
        checkInOut: {
          checkInDate: selectedDates?.from,
          checkOutDate: selectedDates?.to
        },
        status: "CONFIRMED",
        totalPrice: total_price_,
        Adult: getAdult,
        Child: getChild,
        isShared: isShared, // Ensure isShared is assigned properly
        Numberofrooms:totalRooms
      };

      if(selectedDates.from && selectedDates.to){
        if (property.isHotel && (!check_availability())) {
          throw new Error('No rooms available for the selected dates. Please change the dates.');
        } 
      }
      else{
        throw new Error('Please select more than one day.');
      }
        

      setreservationDetails(bookingValues)
      // const booking = await createBooking(bookingValues);
      // if (!booking) {
      //   throw new Error("Error in creating the ");
      // }



      setisReserved(true);
      setShowDialog(true);



    } catch (error) {
      console.log(error)
      toast({
        title: "Error in Creating the Booking",
        variant: "destructive",
        description: `Sorry we couldn't create the booking ${error}`,
      });
    }
  };

  const handleDateSave = async (dates: DateRange | undefined) => {
    // Handle the saved dates (e.g., update state, make API call, etc.)
    console.log("Selected dates:", dates);
    setSelectedDates(dates);
    setIsSelectedDates(true);
  };
  const handleClose = () => setShowDialog(false);

  const handleContinue = async () => {
    setShowDialog(true);
    //Handle the stripe booking part
    // router.push(`/bookings/${kindeUser.id}/${property.id}/payments`)
    setLoading(true);

    try {
      console.log(reservationDetails?.totalPrice ? reservationDetails?.totalPrice : 0)
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: reservationDetails?.totalPrice ? reservationDetails?.totalPrice * 100 : 0,
          PropName: property.name,
          checkIn: reservationDetails?.checkInOut ? reservationDetails.checkInOut.checkInDate.toLocaleDateString() : "N/A",
          checkOut: reservationDetails?.checkInOut ? reservationDetails.checkInOut.checkOutDate.toLocaleDateString() : "N/A",
          propDetails: reservationDetails,

        }), // Convert to cents
      });

      const { sessionId } = await res.json();

      if (sessionId) {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }


  };

  const handleGuestChange = (adults: number, children: number) => {
    console.log('Number of adults:', adults);
    setAdults(adults)
    console.log('Number of children:', children);
    setChild(children)
  };
  const handleShareChange = (value: boolean) => {
    setConfirmShare(value)
    setIsModalOpen(true); // Open modal to confirm
  };

  // Confirm share change logic
  const handleConfirmShare = () => {
    console.log("Property shared status confirmed:", isShared);
    setIsShared(confirmShare);
    setIsModalOpen(false); // Close modal after confirmation
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  const handleRoomsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTotalRooms(Number(event.target.value));
  };
  const handleToggle = () => {
    setIsShared(!isShared);
  };

  const isPropMadeShared=()=>{
    bookings?.map((booking:TBooking)=>{
      if((booking.propertyId === property.id)&& booking.isShared)
        return true
    })
    return false
  }
  const checkDateRangeOverlap = (
    range1: DateRange,
    range2: { from: Date; to: Date }
  ) => {
    if (!range1.from || !range1.to) return false; // If range1 is incomplete, no overlap
  
    return range1.from <= range2.to && range1.to >= range2.from;
  };
  const isdateInrange = () => {
    
    return bookings?.some((booking) => {
      console.log("CheckinDateBooked:",booking.id,"\ ",booking.checkInOut?.checkInDate," | ",booking.checkInOut?.checkOutDate)
      console.log("Selected range:",selectedDates)
      if (booking.propertyId === property.id && selectedDates) {
        const { checkInDate, checkOutDate } = booking?.checkInOut || {};
        if (!checkInDate || !checkOutDate) return false;
  
        const isOverlap = checkDateRangeOverlap(selectedDates, {
          from: checkInDate,
          to: checkOutDate,
        });
        return isOverlap;
      }
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh]">
        <Image
          src={displayedImages[currentImageIndex].link}
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
          {displayedImages.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
            />
          ))}
        </div>
      </div>


      <main className="container mx-auto px-4 py-8">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg p-6 rounded-lg bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-4">
                Reservation Summary
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4 text-gray-700">
              <p className="text-lg">
                <strong className="font-medium">Property:</strong> {property.name}
              </p>
              <p className="text-lg">
                <strong className="font-medium">Check-in:</strong> {reservationDetails?.checkInOut ? reservationDetails.checkInOut.checkInDate.toLocaleDateString() : "N/A"}
              </p>
              <p className="text-lg">
                <strong className="font-medium">Check-out:</strong> {reservationDetails?.checkInOut ? reservationDetails.checkInOut.checkOutDate.toLocaleDateString() : "N/A"}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-300 mt-4">
                <p className="text-xl font-semibold">
                  <strong>Total Price:</strong> ₹{reservationDetails?.totalPrice}
                </p>
              </div>
            </div>
            <DialogFooter className="mt-6 flex justify-between gap-4">
              <Button variant="secondary" onClick={handleClose} className="w-full py-2 text-lg">
                Close
              </Button>
              <Button
                variant="default"
                onClick={handleContinue}
                className={`w-full py-2 text-lg ${loading ? "cursor-not-allowed opacity-50" : "hover:bg-gray-700 hover:text-white"}`}
                disabled={loading}
              >
                {loading ? "Processing..." : "Pay Now"}
              </Button>

            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-400 mr-1" />
              <span className="font-semibold">
                {(() => {
                  const averageRating = findAverageRating(reviews);
                  return averageRating === -1
                    ? "Be the first one to review"
                    : averageRating.toFixed(1);
                })()}
              </span>
              <span className="text-muted-foreground ml-1">
                ({reviews ? reviews.length : 0} reviews)
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
                    <h3 className="font-semibold">{property.isHotel ? 'Rooms Availability' : ''}</h3>
                    <span>
                      {property.isHotel
                        ? (property.maxGuests !== 0 ? 'Rooms Available' : 'No Rooms Available')
                        : (
                          property.maxGuests !== 0 ?
                            `Up to ${property.maxGuests} guests` : 'NO ROOMS LEFT'
                        )
                      }
                      {
                        (isShared && (isdateInrange()??false)) && (
                          <div>
                          <h3 className="font-semibold">Shared Space</h3>
                          <h4>UP to {property.Current_space? property.Current_space-getAdult-getChild+1 : property.maxGuests-getAdult-getChild}</h4>
                          </div>
                        )
                      }
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Price per Night</h3>
                    <p>₹{property.pricePerNight}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Hotel</h3>
                    <p>{property.isHotel ? "Yes" : "No"}</p>
                  </div>
                  <div>


                  </div>
                  {property.isHotel && property.RoomType && (
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-1 text-blue-500" /> {/* Bed icon with custom color */}
                      <span className="text-blue-500 font-semibold bg-blue-100 px-1 rounded">
                        Room Type: {property.RoomType}
                      </span>
                    </div>
                  )
                  }

                </div>
              </CardContent>
            </Card>
            {(!property.isHotel&& isPropMadeShared()) && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Select Property Type</h2>

    {/* Toggle switch */}
    <div className="flex items-center space-x-2">
      <span className="text-sm">Personal</span>
      
      <Switch
        checked={isShared}
        onCheckedChange={handleToggle}
        className={`w-10 h-5 bg-gray-200 rounded-full relative border ${
          isShared ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {/* Toggle indicator */}
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
            isShared ? "translate-x-5 bg-white" : "bg-white"
          }`}
        />
      </Switch>

      <span className="text-sm">Shared</span>
    </div>

    <div className="mt-2">
      <p className="text-sm font-medium">
        Property is:{" "}
        <span className={isShared ? "text-green-500" : "text-red-500"}>
          {isShared ? "Shared" : "Personal"}
        </span>
      </p>
    </div>
  </div>
)}

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities?.map((amenity) => {
                    const Icon = amenityIcons[amenity.name]; // Get the corresponding icon
                    return (
                      <div key={amenity.id} className="flex items-center">
                        {Icon && <Icon className="h-5 w-5 mr-2" />}{" "}
                        {/* Render the icon if it exists */}
                        <span>{amenity.name.replace(/_/g, " ")}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <ReviewCard reviews={reviews} propertyId={property.id} user={host} />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Check Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <DateRangePicker
                  availabilityStart={listing.availabilityStart}
                  availabilityEnd={listing.availabilityEnd}
                  bookings={bookings}
                  type={isShared}
                  max={Math.min(property.maxGuests, property.Current_space ?? Infinity)}
                  onSave={handleDateSave}
                  onClose={handleClose}
                />

{!property.isHotel ? (
  <div>

    <GuestPicker onChange={handleGuestChange} max={(isShared && isdateInrange()) ? Math.min(property.maxGuests, property.Current_space??property.maxGuests): property.maxGuests}
 />

    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Property Settings</h2>

      <div className="space-y-2">
        <Label>Is this property shared?</Label>

        <div className="space-x-4">
          <Button variant="outline" onClick={() => handleShareChange(true)}>
            Yes
          </Button>
          <Button variant="outline" onClick={() => handleShareChange(false)}>
            No
          </Button>
        </div>

        <h3 className="font-semibold">PropertySharing?</h3>
        <p className={isShared ? "text-green-500" : "text-red-500"}>
          {isShared ? "Shared Property" : "Individual Property Book"}
        </p>
      </div>

      {/* Modal for confirmation */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          {/* Trigger is hidden, the button will trigger the modal */}
          <Button className="hidden" />
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Property Sharing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to {isShared ? "share" : "not share"} this
              property? If you choose to share, other users may book the
              remaining space.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="mr-4"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmShare}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
):(
  <div className="space-y-2">
  <Label htmlFor="total-rooms">Total Number of Rooms</Label>
  <Input
    id="total-rooms"
    type="number"
    min="1" // Minimum value for rooms is 1
    value={totalRooms}
    onChange={handleRoomsChange}
    className="w-full"
  />
</div>
)
}

                <Button
                  className="w-full mt-4"
                  onClick={handleSubmit}
                  disabled={Boolean(!isSelectedDates && property.maxGuests === 0)}

                >
                  Reserve
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}

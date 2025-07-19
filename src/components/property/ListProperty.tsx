"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfToday } from "date-fns";
import Image from "next/image";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  listingSchema,
  TImage,
  TListing,
  TLocation,
  TProperty,
  TUser,
} from "@/lib/definitions";
import { DateRange } from "react-day-picker";
import { createListing } from "@/actions/listingActions";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function ListProperty({
  property,
  user,
  location,
  images,
}: {
  property: TProperty;
  user: TUser;
  location: TLocation;
  images: TImage[] | null;
}) {
  const [date, setDate] = useState<DateRange>();

  const { toast } = useToast();
  const router = useRouter();
  const { getUser } = useKindeBrowserClient();

  const form = useForm<TListing>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      userId: user.id,
      propertyId: property.id,
    },
  });

  const displayedImages =
    images && images.length > 0
      ? images
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

  async function onSubmit(values: TListing) {
    console.log("values in lisitng page: ", values);
    try {
      const listing = await createListing(values);
      if (!listing) {
        throw new Error("Error in creating the listing");
      }
      toast({
        title: "Listing created",
        description: "Your property has been successfully listed. redirecting",
      });
      const userKindeId = getUser()?.id;
      router.push(`/user/${userKindeId}/properties`);
    } catch (error) {
      console.log(error)
      toast({
        title: "Couldn't create the Listing",
        description: "Sorry, we were unable to add your listing.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">List Your Property</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{property.name}</CardTitle>
            <CardDescription>
              {location.city}, {location.state}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video relative mb-4">
              <Image
                src={displayedImages[0].link}
                alt={property.name}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
            </div>
            <p className="text-muted-foreground mb-2">{property.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Price per Night</h3>
                <p>${property.pricePerNight}</p>
              </div>
              <div>
                <h3 className="font-semibold">Max Guests</h3>
                <p>{property.maxGuests}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Set Availability</CardTitle>
            <CardDescription>
              Choose the date range when your property will be available for
              booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="availabilityStart"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Availability Period</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full justify-start text-left font-normal ${
                                !date && "text-muted-foreground"
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date?.from ? (
                                date.to ? (
                                  <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(date.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={field.value}
                            selected={date}
                            onSelect={(selectedDate) => {
                              setDate(selectedDate);
                              if (selectedDate?.from) {
                                form.setValue(
                                  "availabilityStart",
                                  selectedDate.from
                                );
                              }
                              if (selectedDate?.to) {
                                form.setValue(
                                  "availabilityEnd",
                                  selectedDate.to
                                );
                              }
                            }}
                            numberOfMonths={2}
                            fromDate={startOfToday()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select the start and end dates for your property&apos;s
                        availability.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Listing</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

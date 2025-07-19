'use client'
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TReview, TUser } from "@/lib/definitions";
import cuid from "cuid";
// import { getUserByKindeId } from "@/actions/userActions";
import { AddReviews, getAllReviewsById } from "@/actions/reviewActions";
import { useToast } from "@/hooks/use-toast";
// import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
// import { revalidatePath } from "next/cache";


const ReviewCard =  ({
  reviews,
  propertyId,
  user,
}: {
  reviews: TReview[] | null;
  propertyId: string;
  user: TUser | null;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [existingReviews, setExistingReviews] = useState<Array<TReview & { name: string }> | null>(null);
  console.log("bus"+reviews+"fyufbyu")
  const {toast}= useToast()


  if(!user){
    return <h1>OOps!! Some thing Went wrong !!</h1>
  }


  useEffect(() => {
    const fetchReviews = async () => {
      const review = await getAllReviewsById(propertyId); // Type inferred as Array<TReview & { name: string }> | null
      setExistingReviews(review);
    };
  
    fetchReviews();
  },[rating,propertyId]);
  
  
  // Assume we have these existing reviews
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle review submission here


    const ratingData : TReview ={
      id: cuid(),
      rating: rating,
      comment : comment,
      userId : user?.id || '' ,
      propertyId : propertyId,
      createdAt : new Date()
    }

    const result= await AddReviews(ratingData)

    console.log({ rating, comment });
    // Reset form
    setRating(0);
    setComment("");

    if (result){
      toast({
        title: 'Successful',
        description: 'Review Added'
      })
      // revalidatePath(`/properties/${propertyId}`)
    }
    else{
      toast({
        title: 'Failed',
        description: 'Review Failed please Try Again'
      })
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="text-xl font-bold">Write A Review</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rating">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={!rating || !comment.trim()}>
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent Reviews</h2>
        {existingReviews?.slice(0, 5).map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{review.name}</span>
                <div className="flex">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`w-4 h-4 ${
                        index < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600">{review.comment}</p>
              <p className="text-sm text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewCard;

'use client'
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Ensure this path points to your Button component

const NoPropertyAvailable: React.FC = () => {
  const router = useRouter();

  const handleRefresh = () => {
    router.push("/");
  };

  return (
    <div className="text-red-600 text-center font-semibold text-lg w-full mt-8 flex flex-col items-center justify-center absolute top-0 left-0 right-0 bottom-0 z-50 bg-gray-100">
      <h1 className="mb-4">No property available</h1>
      <Button 
        onClick={handleRefresh}
        className="flex items-center gap-2 text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md shadow-md"
      >
        <span className="material-icons">refresh</span>
      </Button>
    </div>
  );
};

export default NoPropertyAvailable;

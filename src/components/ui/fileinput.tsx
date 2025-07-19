'use client'; // Only needed if you’re using React Server Components
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
import { useState } from 'react';
import './ui_style.css';
import Image from 'next/image';


const UPLOADCARE_BASE_URL = process.env.NEXT_PUBLIC_UPLOADCARE_BASE_URL!;

import { Delete_UploadCare } from "@/actions/propertyActions";

interface FileInfo {
  uuid: string;
}

interface UploadEvent {
  fileInfo: FileInfo;
}

interface ImageObject {
  id: string;
  link: string;
  propertyId: string;
}

interface FileinputProps {
  images: ImageObject[];  // Array of image objects
  setImages: React.Dispatch<React.SetStateAction<ImageObject[]>>;  // Function to update image objects array
  propertyId: string;  // Pass propertyId as well
}

const Fileinput: React.FC<FileinputProps> = ({ images, setImages, propertyId })=> {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null); // Track hovered image

  // Handle the upload-finish event
  const handleUploadFinish = (fileInfo: FileInfo) => {
    const newImage: ImageObject = {
      id: fileInfo.uuid,
      link: `${UPLOADCARE_BASE_URL}/${fileInfo.uuid}/`,
      propertyId: propertyId,  // Use propertyId passed as prop
    };
    setImages((prev) => [...prev, newImage]);
    console.log("Uploaded Image URLs:", newImage);
  };

  const handleDelete = async (idToDelete: string) => {
    setImages((prev) => prev.filter((image) => image.id !== idToDelete));

    const result = await Delete_UploadCare(idToDelete);
    if (result == 200) {
      console.log('Image removed');
    } else {
      console.log('Failed to remove image');
    }
  };

  return (
    <div>
      <FileUploaderRegular
        sourceList="local, url, camera, dropbox"
        classNameUploader="uc-light"
        pubkey="ecc593f3433cbf4e6114"
        onFileUploadSuccess={(file: UploadEvent) => handleUploadFinish(file.fileInfo)}
      />

      <div className="image-grid">
        {images.map((image) => (
          <div
            className="image-container"
            key={image.id}
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            <Image src={image.link} alt="Uploaded" />

            <button
              className={`delete-button ${hoveredImage === image.id ? '' : 'disabled'}`}
              onClick={() => handleDelete(image.id)}
              disabled={hoveredImage !== image.id}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fileinput;

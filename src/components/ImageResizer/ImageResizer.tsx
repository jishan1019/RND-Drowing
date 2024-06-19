"use client";

import React, { useState } from "react";
import imageCompression from "browser-image-compression";

const ImageResizer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [resizeValue, setResizeValue] = useState<string>("100");
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [customHeight, setCustomHeight] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleResize = async () => {
    if (!selectedFile) return;

    try {
      let outputFile = selectedFile;

      if (useCustomSize && customWidth && customHeight) {
        outputFile = await resizeImage(outputFile, customWidth, customHeight);
      } else {
        outputFile = await compressImage(outputFile, Number(resizeValue));
      }

      const imageUrl = URL.createObjectURL(outputFile);
      setResizedImage(imageUrl);
    } catch (error) {
      console.error(error);
    }
  };

  const resizeImage = async (
    file: File,
    width: number,
    height: number
  ): Promise<File> => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      ctx.drawImage(imageBitmap, 0, 0, width, height);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(
            new File([blob], file.name, {
              type: file.type,
            })
          );
        }
      }, file.type);
    });
  };

  const compressImage = async (
    file: File,
    targetSizeKB: number
  ): Promise<File> => {
    const options = {
      maxSizeMB: targetSizeKB / 1024,
      useWebWorker: true,
    };

    let compressedFile = await imageCompression(file, options);

    while (compressedFile.size > targetSizeKB * 1024) {
      compressedFile = await imageCompression(compressedFile, {
        ...options,
        maxSizeMB: compressedFile.size / 1024 / 1024 / 2,
      });
    }

    return compressedFile;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="border rounded p-2"
        />
        <select
          value={resizeValue}
          onChange={(e) => setResizeValue(e.target.value)}
          className="border rounded p-2"
          disabled={useCustomSize} // Disable dropdown when custom size is selected
        >
          <option value="100">100kb</option>
          <option value="200">200kb</option>
          <option value="300">300kb</option>
        </select>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useCustomSize}
            onChange={(e) => setUseCustomSize(e.target.checked)}
            className="form-checkbox"
          />
          <label className="text-gray-700">Use Custom Width/Height</label>
        </div>
        {useCustomSize && (
          <div className="flex space-x-4">
            <input
              type="number"
              placeholder="Width (px)"
              value={customWidth || ""}
              onChange={(e) => setCustomWidth(Number(e.target.value))}
              className="border rounded p-2"
            />
            <input
              type="number"
              placeholder="Height (px)"
              value={customHeight || ""}
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              className="border rounded p-2"
            />
          </div>
        )}
        <button
          onClick={handleResize}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Resize
        </button>
        {resizedImage && (
          <div className="mt-4">
            <img src={resizedImage} alt="Resized" className="border rounded" />
            <a
              href={resizedImage}
              download="resized-image.jpg"
              className="block mt-2"
            >
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700">
                Download
              </button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResizer;

import DrawingBoard from "@/components/DrawingBoard/DrawingBoard";
import ImageResizer from "@/components/ImageResizer/ImageResizer";

export default function Home() {
  return (
    <main className="w-[98%] mx-auto overflow-hidden ">
      {/* <DrawingBoard /> */}
      <ImageResizer />
    </main>
  );
}

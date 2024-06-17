"use client";

import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent,
  ChangeEvent,
  FormEvent,
  TouchEvent,
} from "react";

type Mode = "draw" | "text" | "touchpad";

interface Text {
  x: number;
  y: number;
  content: string;
}

const DrawingBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<
    { offsetX: number; offsetY: number }[][]
  >([]);
  const [currentStroke, setCurrentStroke] = useState<
    { offsetX: number; offsetY: number }[]
  >([]);
  const [mode, setMode] = useState<Mode>("draw");
  const [texts, setTexts] = useState<Text[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = "white";
    context.lineWidth = 5;
    contextRef.current = context;

    // Render existing strokes and texts
    redraw(strokes, texts);
  }, []);

  const startDrawing = (
    nativeEvent: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (mode !== "draw") return;

    const { offsetX, offsetY } = getEventPosition(nativeEvent);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    setCurrentStroke([{ offsetX, offsetY }]);
  };

  const finishDrawing = () => {
    if (mode !== "draw") return;

    contextRef.current?.closePath();
    setIsDrawing(false);
    setStrokes((prevStrokes) => [...prevStrokes, currentStroke]);
    setCurrentStroke([]);
  };

  const draw = (
    nativeEvent: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing && mode !== "touchpad") return;

    const { offsetX, offsetY } = getEventPosition(nativeEvent);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
    setCurrentStroke((prevStroke) => [...prevStroke, { offsetX, offsetY }]);
  };

  const handleMouseMove = (nativeEvent: MouseEvent<HTMLCanvasElement>) => {
    if (mode === "touchpad") {
      const { offsetX, offsetY } = getEventPosition(nativeEvent);
      contextRef.current?.lineTo(offsetX, offsetY);
      contextRef.current?.stroke();
      setCurrentStroke((prevStroke) => [...prevStroke, { offsetX, offsetY }]);
    } else {
      draw(nativeEvent);
    }
  };

  const handleCanvasClick = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if (mode !== "text") return;

    const { offsetX, offsetY } = getEventPosition(e);
    setTextPosition({ x: offsetX, y: offsetY });
    setShowTextInput(true);
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText) return;

    setTexts((prevTexts) => [
      ...prevTexts,
      { x: textPosition.x, y: textPosition.y, content: inputText },
    ]);
    setInputText("");
    setShowTextInput(false);
    redraw(strokes, [
      ...texts,
      { x: textPosition.x, y: textPosition.y, content: inputText },
    ]);
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
    setTexts([]);
  };

  const undoLast = () => {
    if (strokes.length === 0 && texts.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    const newTexts = texts.slice(0, -1);

    setStrokes(newStrokes);
    setTexts(newTexts);

    redraw(newStrokes, newTexts);
  };

  const redraw = (
    strokes: { offsetX: number; offsetY: number }[][],
    texts: Text[]
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      context?.beginPath();
      stroke.forEach(({ offsetX, offsetY }, index) => {
        if (index === 0) {
          context?.moveTo(offsetX, offsetY);
        } else {
          context?.lineTo(offsetX, offsetY);
          context?.stroke();
        }
      });
      context?.closePath();
    });

    texts.forEach(({ x, y, content }) => {
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        context?.fillText(line, x, y + i * 24);
      });
    });
  };

  const getEventPosition = (
    e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>
  ) => {
    if ("touches" in e.nativeEvent) {
      const touch = e.nativeEvent.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      return {
        offsetX: touch.clientX - (rect?.left || 0),
        offsetY: touch.clientY - (rect?.top || 0),
      };
    } else {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY,
      };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = "24px Arial";
    context.fillStyle = "white";
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 sm:grid-cols-5  m-3 gap-3">
        <button
          onClick={() => setMode("draw")}
          className={`px-2 py-2 h-16 lg:h-12 rounded-md text-sm w-full hover:bg-transparent hover:border hover:border-red-500 ${
            mode === "draw" ? "bg-blue-500 text-white" : "bg-gray-500"
          }`}
        >
          Draw
        </button>
        <button
          onClick={() => setMode("text")}
          className={`px-2 py-2 h-16 lg:h-12 rounded-md text-sm w-full hover:bg-transparent hover:border hover:border-red-500 ${
            mode === "text" ? "bg-blue-500 text-white" : "bg-gray-500"
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setMode("touchpad")}
          className={`px-2 py-2 h-16 lg:h-12 rounded-md text-sm w-full hover:bg-transparent hover:border hover:border-red-500 ${
            mode === "touchpad" ? "bg-blue-500 text-white" : "bg-gray-500"
          }`}
        >
          Touchpad
        </button>
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-red-500 text-white h-16 lg:h-12 rounded-md text-sm w-full hover:bg-transparent hover:border hover:border-red-500"
        >
          Clear All
        </button>
        <button
          onClick={undoLast}
          className="px-4 py-2 bg-yellow-600 text-white h-16 lg:h-12 rounded-md text-sm w-full hover:bg-transparent hover:border hover:border-red-500"
        >
          Undo Last Draw
        </button>
      </div>

      <canvas
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={handleMouseMove}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
        onClick={handleCanvasClick}
        ref={canvasRef}
        className="bg-black border border-white"
      />
      {showTextInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-gray-800 p-4 rounded shadow-lg  w-[95%] lg:w-[40%]">
            <form onSubmit={handleTextSubmit}>
              <textarea
                value={inputText}
                onChange={handleTextChange}
                rows={4}
                className="w-full p-2 mb-2 border border-gray-700 rounded bg-gray-900 text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Text
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;

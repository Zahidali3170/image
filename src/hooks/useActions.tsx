import { useEffect, useState } from "react";
import { MarkerArea } from "markerjs2";

const useActions = () => {
  const [markerArea, setMarkerArea] = useState<MarkerArea>();

  useEffect(() => {
    window.onkeydown = (e) => {
      if (!markerArea) return null;

      // undo marker changes
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        markerArea.undo();
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      // redo marker changes
      if (
        (e.key === "y" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        markerArea.redo();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
  }, [markerArea]);

  return {
    setMarkerArea,
    markerArea,
  };
};

export default useActions;

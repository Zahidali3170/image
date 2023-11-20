import React, { createRef, useCallback, useEffect, useState } from "react";
import "./App.css";

import * as markerjs2 from "markerjs2";
import { MarkerAreaState } from "markerjs2";
import { saveAs } from "file-saver";

import { TriangleMarker } from "./markers/TriangleMarker";
import { LocationPinMarker } from "./markers/LocationPinMarker";

import useActions from "./hooks/useActions";

function App() {
  const imgRef = createRef<HTMLImageElement>();

  const [markerState, setMarkerState] = useState<MarkerAreaState | null>(null);
  const [previewImageSrc, setPreviewImageSrc] = useState<string>("");
  const [markerImageSrc, setMarkerImageSrc] = useState<string>("");
  const [downloadSrc, setDownloadSrc] = useState<string | undefined>(undefined);
  const [isChangesMade, setIsChangesMade] = useState<boolean>(false);

  const { setMarkerArea, markerArea } = useActions();

  const downLoadImageName = "image-annotation";

  const showMarkerArea = () => {
    if (imgRef.current !== null) {
      // Clean up previous markers
      if (markerArea) {
        markerArea.close();
      }

      // Create a new MarkerArea instance
      const newMarkerArea = new markerjs2.MarkerArea(imgRef.current);

      const callOutMarker = markerjs2.CalloutMarker;

      callOutMarker.title = "CREATE LABELS";

      newMarkerArea.availableMarkerTypes = [
        LocationPinMarker,
        callOutMarker,
        TriangleMarker,
        ...newMarkerArea.DEFAULT_MARKER_TYPES.filter(
          (marker) => marker.title !== callOutMarker.title
        ),
      ];

      newMarkerArea.addEventListener("render", (event) => {
        if (event.state.markers.length <= 0) {
          return;
        }
        setDownloadSrc(event.dataUrl);
        setMarkerImageSrc(event.dataUrl);
        setMarkerState(event.state);
      });

      newMarkerArea.addEventListener("statechange", (event) => {
        if (event.markerArea.isOpen || event.markerArea.isFocused) {
          setIsChangesMade(true);
        }
      });

      newMarkerArea.addEventListener("markerbeforedelete", (event) => {
        if (event.marker && event.marker.state === "select") {
          if (!confirm(`delete marker${event.marker ? "" : "s"}?`)) {
            event.preventDefault();
          }
        } else {
          // newMarkerArea.clear();
        }
      });

      newMarkerArea.show();

      if (markerState) newMarkerArea.restoreState(markerState);

      // Store the current MarkerArea instance
      setMarkerArea(newMarkerArea);
    }
  };

  function clearMarkerStates() {
    markerArea?.clear();
    markerArea?.close();
    setMarkerState(null);
  }

  const handleUploadAction = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      if (!e.currentTarget.files) {
        throw new Error("please upload image!");
      } else if (isChangesMade) {
        if (
          confirm(
            "you have unsaved changes. if you don't want the changes then continue."
          )
        ) {
          clearMarkerStates();
        } else {
          return;
        }
      }

      clearMarkerStates();

      const file = e.currentTarget.files[0];

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result;

          if (!imageData) return null;

          setPreviewImageSrc(imageData.toString());
        } catch (error) {
          console.log("🚀 ~ file: App.tsx:81 ~ reader.onload= ~ error:", error);
        }
      };

      reader.readAsDataURL(file);
    },
    [imgRef.current, markerArea, isChangesMade]
  );

  const handleDownloadBtnAction = useCallback(() => {
    if (!downloadSrc) return null;
    saveAs(downloadSrc, `${downLoadImageName}.jpg`);
    setMarkerImageSrc("");
    clearMarkerStates();
  }, [downloadSrc, markerArea]);

  const handlePreviewImageAction = (
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    e.preventDefault();

    showMarkerArea();
  };

  useEffect(() => {
    if (previewImageSrc) {
      showMarkerArea();
    }
  }, [previewImageSrc]);

  return (
    <div className="App">
      <div className="marker-form">
        <div className="image-controls">
          <label htmlFor="marker-image">Select Image</label>
          <input
            type="file"
            name="marker-image"
            id="marker-image"
            accept=".jpg,.jpeg,.png,.svg"
            onChange={handleUploadAction}
          />
          <button type="button" onClick={handleDownloadBtnAction}>
            Download
          </button>
        </div>
        {previewImageSrc && (
          <img
            ref={imgRef}
            src={markerImageSrc ? markerImageSrc : previewImageSrc}
            alt="sample"
            style={{
              minWidth: "100%",
              minHeight: "300px",
              maxWidth: "900px",
              maxHeight: "700px",
            }}
            onClick={handlePreviewImageAction}
          />
        )}
      </div>
    </div>
  );
}

export default App;

function svgToBase64Url(imageData: string) {
  // Create a Data URI with the SVG content
  const dataUri = `data:image/svg+xml;base64,${btoa(imageData)}`;
  return dataUri;
}

const createSvgToBase64 = (svgString: string) => {
  if (!svgString) return "";

  const base64Url = svgToBase64Url(svgString);

  return base64Url;
};

export default createSvgToBase64;

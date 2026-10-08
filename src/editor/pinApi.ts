export interface PinApiResponse {
  source: string;
  thumbnail: string;
  original: string;
}

const PIN_API_BASE = "https://09176645.xyz/pin-image-urls";

/** Resolves a Pinterest pin link (pin.it or full URL) to its image URLs. */
export async function fetchPinImages(pinUrl: string): Promise<PinApiResponse> {
  const apiUrl = `${PIN_API_BASE}/?url=${encodeURIComponent(pinUrl.trim())}`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

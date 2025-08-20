/**
 * Google Translate integration service
 * Provides Google Translate functionality with DeepLX-compatible API format
 */

import { createErrorResponse } from "../errorHandler";
import {
  Config,
  createStandardResponse,
  RequestParams,
  ResponseParams,
} from "../types";

/**
 * Translate text using Google Translate API
 * @param params - Translation parameters (text, source_lang, target_lang)
 * @param config - Configuration options
 * @returns Translation response in DeepLX format
 */
export async function translateWithGoogle(
  params: RequestParams,
  config?: Config & { env?: any; clientIP?: string }
): Promise<ResponseParams> {
  try {
    const { text, source_lang, target_lang } = params;

    // Construct the request to Google Translate's internal API
    const googleApiUrl = new URL(
      "https://translate.google.com/translate_a/single"
    );
    googleApiUrl.searchParams.append("client", "gtx"); // Google Translate web client
    googleApiUrl.searchParams.append(
      "sl",
      source_lang === "auto" ? "auto" : source_lang.toLowerCase()
    ); // Source language
    googleApiUrl.searchParams.append("tl", target_lang.toLowerCase()); // Target language
    googleApiUrl.searchParams.append("dt", "t"); // 't' for translation of text
    googleApiUrl.searchParams.append("q", text); // The text to translate

    // Make the fetch call to Google Translate
    const googleResponse = await fetch(googleApiUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://translate.google.com/",
      },
    });

    if (!googleResponse.ok) {
      throw new Error(
        `Google Translate API responded with status ${googleResponse.status}`
      );
    }

    const googleResponseBody = await googleResponse.json();

    // Parse the complex Google Translate response
    // The response is a deeply nested array. The translated text is
    // typically in the first element. We concatenate the pieces.
    let translatedText = "";
    if (googleResponseBody && googleResponseBody[0]) {
      googleResponseBody[0].forEach((segment: any) => {
        if (segment[0]) {
          translatedText += segment[0];
        }
      });
    }

    if (!translatedText) {
      throw new Error("No translation result received from Google Translate");
    }

    // Format the response to match the DeepLX API
    const detectedSourceLang = googleResponseBody[2] || source_lang;

    return createStandardResponse(
      200,
      translatedText,
      Math.floor(Math.random() * 10000000000),
      detectedSourceLang.toUpperCase(),
      target_lang.toUpperCase()
    );
  } catch (error) {
    console.error("Error in Google Translate:", error);

    const errorResponse = createErrorResponse(error, {
      endpoint: "/google",
      clientIP: config?.clientIP || "unknown",
    });

    return errorResponse.response;
  }
}

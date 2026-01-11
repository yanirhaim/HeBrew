import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid text. Please provide text to convert to speech." },
        { status: 400 }
      );
    }

    // Initialize the Text-to-Speech client
    // It will use GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)
    // or GOOGLE_CLOUD_CREDENTIALS env var (JSON string)
    // or other standard Google Cloud authentication methods
    let client: TextToSpeechClient;
    
    try {
      // Try to use credentials from environment variable
      if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
        // If credentials are provided as JSON string
        const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
        client = new TextToSpeechClient({ credentials });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // If path to credentials file is provided
        client = new TextToSpeechClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
      } else {
        // Try to use Application Default Credentials (ADC)
        // This works if running on GCP or if gcloud auth application-default login was run
        client = new TextToSpeechClient();
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        {
          error: "Failed to authenticate with Google Cloud. Please set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CLOUD_CREDENTIALS environment variable.",
          details: authError instanceof Error ? authError.message : "Unknown authentication error"
        },
        { status: 500 }
      );
    }

    // Request body for Text-to-Speech API
    // Note: Hebrew (he-IL) may not be fully supported
    const synthesizeRequest = {
      input: {
        text: text.trim(),
      },
      voice: {
        languageCode: "he-IL", // Hebrew - Israel
        name: "he-IL-Wavenet-A", // Try WaveNet voice for Hebrew (if available)
        ssmlGender: "FEMALE" as const,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: 1.0,
        pitch: 0.0,
      },
    };

    try {
      const [response] = await client.synthesizeSpeech(synthesizeRequest);
      
      if (!response.audioContent) {
        return NextResponse.json(
          { error: "No audio content in response" },
          { status: 500 }
        );
      }

      // Convert audio content to base64 string
      const audioContent = Buffer.from(response.audioContent).toString("base64");

      // Return the base64-encoded audio content
      return NextResponse.json({
        audioContent,
        audioEncoding: synthesizeRequest.audioConfig.audioEncoding,
      });
    } catch (apiError: any) {
      console.error("Text-to-Speech API error:", apiError);
      
      // Handle Hebrew language not supported
      if (apiError.code === 3 || apiError.message?.includes("not supported")) {
        return NextResponse.json(
          {
            error: "Hebrew language is not supported by the Text-to-Speech API, or the voice is not available.",
            details: apiError.message || "Language/voice not supported"
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          error: "Failed to generate speech",
          details: apiError.message || "Unknown error"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in text-to-speech route:", error);
    
    return NextResponse.json(
      {
        error: "Failed to generate speech. Please try again.",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

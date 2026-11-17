
import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary environment variables are missing" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image uploaded" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 10MB" },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "memories";

    const signatureString = `folder=${folder}&timestamp=${timestamp}`;

    const signature = createHmac("sha1", apiSecret)
      .update(signatureString)
      .digest("hex");

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", String(timestamp));
    uploadData.append("folder", folder);
    uploadData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary upload error:", result);
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      { error: "Something went wrong while uploading" },
      { status: 500 }
    );
  }
}

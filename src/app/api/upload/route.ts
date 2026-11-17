
import { NextResponse } from "next/server";
import { createHash } from "crypto";

export async function POST(req: Request) {
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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
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
        { error: "Image size must be less than 10MB" },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "memories";

    // Cloudinary requires SHA-1, not HMAC
    const stringToSign = `folder=${folder}&timestamp=${timestamp}`;

    const signature = createHash("sha1")
      .update(stringToSign + apiSecret)
      .digest("hex");

    const cloudinaryForm = new FormData();

    cloudinaryForm.append("file", file);
    cloudinaryForm.append("api_key", apiKey);
    cloudinaryForm.append("timestamp", timestamp.toString());
    cloudinaryForm.append("folder", folder);
    cloudinaryForm.append("signature", signature);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
      }
    );

    const result = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.error("Cloudinary upload error:", result);

      return NextResponse.json(
        { error: result.error?.message || "Cloudinary upload failed" },
        { status: uploadResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });

  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json(
      { error: "Internal server error during image upload" },
      { status: 500 }
    );
  }
}

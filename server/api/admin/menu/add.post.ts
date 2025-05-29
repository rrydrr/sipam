import {
  H3Event,
  getRequestHeaders,
  setResponseStatus,
  readMultipartFormData,
} from "h3";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma";

const jwtPayloadSchema = z.object({
  idUser: z.number(),
  username: z.string(),
  iss: z.string().optional(), // Issuer
  exp: z.number(), // Expiration Time
  iat: z.number(), // Issued At
});

// Schema for the text fields we expect in the form-data for creating a menu item
const menuFormDataSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  description: z.string().optional(),
});

// Helper function to send a 401 Unauthorized response
function invalidTokenResponse(event: H3Event) {
  setResponseStatus(event, 401);
  return {
    success: false,
    message: "Invalid or expired token.",
  };
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const headers = getRequestHeaders(event);
    const authorization = headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      setResponseStatus(event, 401);
      return {
        success: false,
        message: "Authorization token is missing or malformed.",
      };
    }

    const token = authorization.substring(7);

    const jwtSecret = process.env.JWT_SECRET;
    const expectedIssuer = process.env.BASE_URL || "http://localhost:3000";

    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables.");
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Internal server error (JWT_SECRET missing).",
      };
    }

    let decodedPayload: z.infer<typeof jwtPayloadSchema>;
    try {
      const verified = jwt.verify(token, jwtSecret, {
        issuer: expectedIssuer,
      }) as object;
      decodedPayload = jwtPayloadSchema.parse(verified);
    } catch (verifyError) {
      if (
        verifyError instanceof jwt.JsonWebTokenError ||
        verifyError instanceof z.ZodError
      ) {
        return invalidTokenResponse(event);
      }
      throw verifyError;
    }

    const user = await prisma.user.findUnique({
      where: { username: decodedPayload.username, id: decodedPayload.idUser },
    });

    if (!user) {
      return invalidTokenResponse(event);
    }

    const formData = await readMultipartFormData(event);
    if (!formData) {
      setResponseStatus(event, 400);
      return { success: false, message: "Form data is missing." };
    }

    const menuData: Record<string, string | undefined> = {};
    let imageFile:
      | { filename?: string; type?: string; data: Buffer }
      | undefined = undefined;

    for (const part of formData) {
      if (part.name === "image") {
        if (part.filename && part.type && part.data) {
          imageFile = {
            filename: part.filename,
            type: part.type,
            data: part.data,
          };
        }
      } else if (part.name && part.data !== undefined) {
        menuData[part.name] = part.data.toString();
      }
    }

    const parsedMenuData = menuFormDataSchema.safeParse({
      name: menuData.name,
      price: menuData.price,
      description: menuData.description,
    });

    if (!parsedMenuData.success) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid menu data.",
        errors: parsedMenuData.error.flatten().fieldErrors,
      };
    }

    if (
      !imageFile ||
      !imageFile.data ||
      imageFile.data.length === 0 ||
      imageFile.type !== "image/webp"
    ) {
      // Check if data buffer exists and is not empty
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Menu image data is required or image type is not webp.",
      };
    }

    const imageBase64 = Buffer.from(imageFile.data).toString("base64");

    // --- Create Menu Item in Database with Image Bytes ---
    const { name, price, description } = parsedMenuData.data;
    const numericPrice = parseFloat(price);

    try {
      const newMenu = await prisma.menu.create({
        data: {
          name: name,
          price: numericPrice,
          description: description || "",
          image: imageFile.data, // Store the image Buffer directly
          isActive: true, // Default to active
        },
      });

      setResponseStatus(event, 201); // 201 Created
      return {
        success: true,
        message: "Menu item created successfully with image stored in DB.",
        data: {
          id: newMenu.id, // Return only non-sensitive data, not the image bytes in response
          name: newMenu.name,
          price: newMenu.price,
          description: newMenu.description,
        },
      };
    } catch (dbError) {
      console.error("Failed to create menu item in database:", dbError);
      setResponseStatus(event, 500);
      // No file cleanup needed as we are not saving to filesystem
      return {
        success: false,
        message: "Failed to create menu item in database.",
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid request data.",
        errors: error.errors,
      };
    }
    console.error("Admin create menu API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

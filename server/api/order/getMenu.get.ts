import jwt from "jsonwebtoken";
import { z } from "zod";
import { id } from "zod/v4/locales";
import prisma from "~/lib/prisma";

const jwtPayloadSchema = z.object({
  idOrder: z.string(),
  iss: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

function invalidTokenResponse(event: any) {
  setResponseStatus(event, 401);
  return {
    success: false,
    message: "Invalid or expired token.",
  };
}

function parseImage(image: Buffer | Uint8Array) {
  const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image);
  return `data:image/webp;base64,${buffer.toString("base64")}`;
}

export default defineEventHandler(async (event) => {
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
        message: "Internal server error.",
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

    const order = await prisma.order.findUnique({
      where: { id: decodedPayload.idOrder },
    });

    if (!order || order.id !== decodedPayload.idOrder) {
      return invalidTokenResponse(event);
    }

    const menu = await prisma.menu.findMany({});

    const menuGroupedByCategory = menu.reduce((acc, item) => {
      const kategori = item.kategori || "Lainnya";
      if (!acc[kategori]) {
        acc[kategori] = [];
      }
      acc[kategori].push({
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image ? parseImage(item.image) : null,
        // image: "data:image/webp;base64,xxxx",
        price: item.price,
        isActive: item.isActive,
      });
      return acc;
    }, {} as Record<string, any>);

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Get menu successfully.",
      data: {
        menu: menuGroupedByCategory,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid request body or JWT token.",
        errors: error.errors,
      };
    }
    console.error("Customer get menu API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

import { H3Event, getRequestHeaders, setResponseStatus } from "h3";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma";
import QRCodeGenerator from "qrcode"; // Library to generate QR codes

const jwtPayloadSchema = z.object({
  idUser: z.number(),
  username: z.string(),
  iss: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

const bodySchema = z
  .object({
    idMeja: z.number(),
  })
  .strict();

function invalidTokenResponse(event: H3Event) {
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

function internalServerErrorResponse(event: H3Event) {
  setResponseStatus(event, 500);
  return {
    success: false,
    message: "Internal server error.",
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

    const user = await prisma.user.findUnique({
      where: { username: decodedPayload.username, id: decodedPayload.idUser },
    });

    if (!user) {
      return invalidTokenResponse(event);
    }

    // const parsedBody = bodySchema.parse(await readBody(event));

    const menu = await prisma.menu.findMany({});

    return {
      success: true,
      message: "Menu retrieved successfully.",
      data: menu.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image != null ? parseImage(item.image as Buffer) : null,
      })),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid request body.",
        errors: error.errors,
      };
    }
    console.error("Admin dashboard API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

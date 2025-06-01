import { H3Event, getRequestHeaders, setResponseStatus } from "h3";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma";

const jwtPayloadSchema = z.object({
  idUser: z.number(),
  username: z.string(),
  iss: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

const itemIdSchema = z
  .object({
    idItem: z.string(),
  })
  .strict();

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

    let decodedItemId: z.infer<typeof itemIdSchema>;
    try {
      const body = await readBody(event);
      decodedItemId = itemIdSchema.parse(body);
    } catch (parseError) {
      console.error("Item ID parsing error:", parseError);
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid item ID format.",
      };
    }

    const item = await prisma.item.findUnique({
      where: { id: decodedItemId.idItem },
    });

    if (!item) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: "Item not found.",
      };
    }

    if (item.isDelivered) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Item is already completed.",
      };
    }

    const updatedItem = await prisma.item.update({
      where: { id: decodedItemId.idItem },
      data: { isDelivered: true },
    });

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Item completed successfully.",
      data: {
        item: {
          id: updatedItem.id,
          isDelivered: updatedItem.isDelivered,
        },
      },
    };
  } catch (error) {
    console.error("Admin complete item API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

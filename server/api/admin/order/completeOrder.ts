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

const idOrderSchema = z
  .object({
    idOrder: z.string(),
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

    let decodedItemId: z.infer<typeof idOrderSchema>;
    try {
      const body = await readBody(event);
      decodedItemId = idOrderSchema.parse(body);
    } catch (parseError) {
      console.error("Order ID parsing error:", parseError);
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid order ID format.",
      };
    }

    const order = await prisma.order.findUnique({
      where: { id: decodedItemId.idOrder },
      include: {
        Item: true,
      },
    });

    if (!order) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: "Order not found.",
      };
    }

    if (!order.isPaid) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Order must be paid before it can be completed.",
      };
    }

    if (!order.isDone) {
      await prisma.item.updateMany({
        where: { idOrder: order.id, isDelivered: false },
        data: { isDelivered: true },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { isDone: true },
      });

      setResponseStatus(event, 200);
      return {
        success: true,
        message: "Order completed successfully.",
      };
    } else {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Order is already completed.",
      };
    }
  } catch (error) {
    console.error("Admin complete item API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

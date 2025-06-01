import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma"; // Assuming prisma client is correctly set up
import {
  getRouterParam,
  getRequestHeaders,
  setResponseStatus,
  defineEventHandler, // Assuming defineEventHandler is available from h3 or a similar library
} from "h3";

// Schema for JWT payload
const jwtPayloadSchema = z.object({
  idOrder: z.string(),
  iss: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

// Helper function for invalid token response
function invalidTokenResponse(event: any, message?: string) {
  setResponseStatus(event, 401);
  return {
    success: false,
    message: message || "Invalid or expired token.",
  };
}

export default defineEventHandler(async (event) => {
  try {
    const idOrderFromParam = getRouterParam(event, "idOrder");

    if (!idOrderFromParam) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Order ID is missing from URL parameters.",
      };
    }

    // --- Authorization and Token Validation ---
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
      console.error("JWT_SECRET is not defined.");
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Internal server error: JWT secret not configured.",
      };
    }

    let decodedPayload: z.infer<typeof jwtPayloadSchema>;
    try {
      const verified = jwt.verify(token, jwtSecret, {
        issuer: expectedIssuer,
      }) as object; // Cast to object before parsing with Zod
      decodedPayload = jwtPayloadSchema.parse(verified);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      if (
        verifyError instanceof jwt.JsonWebTokenError ||
        verifyError instanceof jwt.TokenExpiredError ||
        verifyError instanceof jwt.NotBeforeError ||
        verifyError instanceof z.ZodError
      ) {
        return invalidTokenResponse(event);
      }
      throw verifyError;
    }

    if (decodedPayload.idOrder !== idOrderFromParam) {
      return invalidTokenResponse(event, "Token is not valid for this order.");
    }

    // --- Order Validation ---
    const order = await prisma.order.findUnique({
      where: { id: idOrderFromParam },
      select: {
        id: true,
        isDone: true,
        total: true,
        Item: {
          include: {
            menu: {
              select: { name: true },
            },
          },
        },
        note: true,
        isPaid: true,
      },
    });

    if (!order) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: "Order not found.",
      };
    }

    if (order.id !== decodedPayload.idOrder) {
      return invalidTokenResponse(
        event,
        "Order ID mismatch after fetching order."
      );
    }

    return {
      order: order,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid request body.",
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      };
    }
    console.error("Customer update order API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

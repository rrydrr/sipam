import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma";

const jwtPayloadSchema = z.object({
  idOrder: z.string(),
  iss: z.string().optional(),
  exp: z.number(),
  iat: z.number(),
});

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

    const order = await prisma.order.findUnique({
      where: { id: idOrderFromParam },
    });

    if (!order || order.id !== decodedPayload.idOrder) {
      return invalidTokenResponse(event);
    }

    // if (order.isPaid) {
    //   setResponseStatus(event, 403);
    //   return {
    //     success: false,
    //     message: "Order is already paid and cannot be modified.",
    //   };
    // }

    const orderComplete = await prisma.order.update({
      where: { id: idOrderFromParam },
      data: { isPaid: true },
    });

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Order paid successfully.",
      data: {
        item: {
          id: orderComplete.id,
          idMeja: orderComplete.idMeja,
          idUser: orderComplete.idUser,
          idCabang: orderComplete.idCabang,
          total: orderComplete.total,
          isPaid: orderComplete.isPaid,
          isDone: orderComplete.isDone,
        },
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
    console.error("Customer add item API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

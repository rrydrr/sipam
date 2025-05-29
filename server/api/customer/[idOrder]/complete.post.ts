import jwt from "jsonwebtoken";
import { z } from "zod";
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

export default defineEventHandler(async (event) => {
  try {
    const idOrder = getRouterParam(event, "idOrder");
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
      where: { id: idOrder },
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
      where: { id: idOrder },
      data: { isPaid: true },
    });

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Order completed successfully.",
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

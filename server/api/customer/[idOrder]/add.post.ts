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

const bodySchema = z
  .object({
    idMenu: z.number(),
    qty: z.number().min(1, "Quantity must be at least 1"),
  })
  .strict();

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

    if (order.isPaid) {
      setResponseStatus(event, 403);
      return {
        success: false,
        message: "Order is already paid and cannot be modified.",
      };
    }

    const parsedBody = bodySchema.parse(await readBody(event));

    const menu = await prisma.menu.findUnique({
      where: { id: parsedBody.idMenu },
    });

    if (!menu) {
      setResponseStatus(event, 404);
      return {
        success: false,
        message: "Menu item not found.",
      };
    }

    let item;
    try {
      const existingItem = await prisma.item.findFirst({
        where: {
          idOrder: order.id,
          idMenu: parsedBody.idMenu,
        },
      });

      if (existingItem) {
        item = await prisma.item.update({
          where: { id: existingItem.id },
          data: {
            qty: parsedBody.qty,
            price: menu.price * parsedBody.qty,
          },
        });
      } else {
        item = await prisma.item.create({
          data: {
            idOrder: order.id,
            idMenu: parsedBody.idMenu,
            qty: parsedBody.qty,
            price: menu.price * parsedBody.qty,
            isDelivered: false,
          },
        });
      }
    } catch (error) {
      console.error("Failed to create or update item:", error);
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Failed to create or update order item.",
      };
    }

    try {
      const orderItems = await prisma.item.findMany({
        where: { idOrder: order.id },
      });

      const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          total: totalPrice,
        },
      });
    } catch (error) {
      console.error("Failed to update order total:", error);
      try {
        if (item && item.id) {
          // Ensure item and item.id exist before trying to delete
          await prisma.item.delete({ where: { id: item.id } });
        }
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Failed to update order total.",
      };
    }

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Item added to order successfully.",
      data: {
        item: item,
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

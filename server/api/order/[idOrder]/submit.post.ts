import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "~/lib/prisma"; // Assuming prisma client is correctly set up
import {
  getRouterParam,
  getRequestHeaders,
  readBody,
  setResponseStatus,
  defineEventHandler, // Assuming defineEventHandler is available from h3 or a similar library
} from "h3";

// Schema for individual item in the request body
const itemSchema = z.object({
  id: z.number(), // This ID represents the menuId
  qty: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().positive("Price must be a positive number").optional(), // Price from request, will be ignored. Authoritative price comes from Menu.
});

// Schema for the 'order' object in the request body
const orderDataSchema = z.object({
  id: z.string().uuid("Order ID in body must be a valid UUID"), // To be validated against idOrder from URL
  total: z
    .number()
    .nonnegative("Total must be a non-negative number")
    .optional(), // Total from input, will be validated against calculated total (using menu prices)
  note: z.string().optional(),
  item: z.array(itemSchema).min(0, "Item array can be empty to clear items."),
});

// Schema for the main request body
const requestBodySchema = z
  .object({
    order: orderDataSchema,
  })
  .strict();

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

    if (order.isPaid) {
      setResponseStatus(event, 403);
      return {
        success: false,
        message: "Order is already paid and cannot be modified.",
      };
    }

    // --- Request Body Validation ---
    const body = await readBody(event);
    const parsedBody = requestBodySchema.parse(body);

    if (parsedBody.order.id !== idOrderFromParam) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Order ID in request body does not match Order ID in URL.",
      };
    }

    // --- Database Operations in a Transaction ---
    let updatedOrderResult;
    let finalItemsResult; // Renamed to avoid conflict with loop variable
    let calculatedTotal = 0;

    try {
      updatedOrderResult = await prisma.$transaction(async (tx) => {
        if (parsedBody.order.note !== undefined) {
          await tx.order.update({
            where: { id: idOrderFromParam },
            data: {
              note: parsedBody.order.note,
            },
          });
        }

        const inputMenuItems = parsedBody.order.item;
        const inputMenuIds = inputMenuItems.map((item) => item.id);

        // OPTIMIZATION: Fetch all relevant menu items at once
        const menus = await tx.menu.findMany({
          where: {
            id: { in: inputMenuIds }, // Fetch all menus whose IDs are in the input
          },
        });

        // Create a Map for quick lookup: menuId -> menuObject
        const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

        // OPTIMIZATION: Check if all requested menu items were found BEFORE the loop
        for (const requestedMenuId of inputMenuIds) {
          if (!menuMap.has(requestedMenuId)) {
            // This will abort the transaction
            throw new Error(
              `Menu item with id ${requestedMenuId} not found. Cannot determine price.`
            );
          }
        }

        // 2. Delete items that are not in the current input
        await tx.item.deleteMany({
          where: {
            idOrder: idOrderFromParam,
            idMenu: {
              notIn: inputMenuIds,
            },
          },
        });

        // 3. Upsert items from the input
        for (const itemFromRequest of inputMenuItems) {
          // Fetch the authoritative price from the pre-fetched menuMap
          const menu = menuMap.get(itemFromRequest.id);
          // The check above ensures 'menu' is not undefined, but a non-null assertion or check can be used for safety
          const authoritativePrice = menu!.price; // Price from the Menu table

          const existingItem = await tx.item.findFirst({
            where: {
              idOrder: idOrderFromParam,
              idMenu: itemFromRequest.id,
            },
          });

          if (existingItem) {
            await tx.item.update({
              where: { id: existingItem.id },
              data: {
                qty: itemFromRequest.qty,
                price: authoritativePrice,
              },
            });
          } else {
            await tx.item.create({
              data: {
                idOrder: idOrderFromParam,
                idMenu: itemFromRequest.id,
                qty: itemFromRequest.qty,
                price: authoritativePrice,
                isDelivered: false,
              },
            });
          }
        }

        // 4. Fetch all current items for the order to recalculate total
        // finalItemsResult will now have items with the authoritative price
        finalItemsResult = await tx.item.findMany({
          where: { idOrder: idOrderFromParam },
        });

        // 5. Recalculate total based on current items in DB (prices are now authoritative)
        calculatedTotal = finalItemsResult.reduce(
          (sum, dbItem) => sum + dbItem.qty * dbItem.price, // dbItem.price is menu.price
          0
        );

        // 6. Validate recalculated total against request total (if provided)
        if (
          parsedBody.order.total !== undefined &&
          parsedBody.order.total !== calculatedTotal
        ) {
          // This will abort the transaction
          throw new Error(
            `Request total (${parsedBody.order.total}) does not match calculated total (${calculatedTotal}).`
          );
        }

        // 7. Update order total
        const finalUpdatedOrder = await tx.order.update({
          where: { id: idOrderFromParam },
          data: { total: calculatedTotal },
          include: { Item: true }, // Include items in the final returned order
        });

        return finalUpdatedOrder;
      });
    } catch (transactionError: any) {
      // Catch specific error for total mismatch or missing menu
      console.error("Transaction failed:", transactionError);
      if (
        transactionError.message?.includes("does not match calculated total") ||
        transactionError.message?.includes("Menu item with id")
      ) {
        setResponseStatus(event, 400); // Bad Request
        return {
          success: false,
          message: transactionError.message,
        };
      }
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Failed to update order due to a database error.",
      };
    }

    return {
      success: true,
      message: "Order updated successfully.",
      order: {
        id: updatedOrderResult.id,
        note: updatedOrderResult.note,
        total: updatedOrderResult.total, // Use total from the updated order record
        isPaid: updatedOrderResult.isPaid,
        // Ensure the relation name 'Item' matches your Prisma schema for Order model
        items: updatedOrderResult.Item.map((item) => ({
          id: item.id, // This is item (OrderItem) ID
          idMenu: item.idMenu,
          qty: item.qty,
          price: item.price, // This price is now the authoritative price from Menu
        })),
      },
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

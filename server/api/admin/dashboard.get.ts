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

    let cabang = null;
    let orders: any = [];
    if (user.idCabang != null) {
      cabang = await prisma.cabang.findUnique({
        where: { id: user.idCabang },
      });
      if (cabang) {
        orders = await prisma.order.findMany({
          where: { idCabang: cabang.id, isDone: false },
          include: {
            Item: {
              include: {
                menu: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    setResponseStatus(event, 200);
    return {
      success: true,
      message: `Welcome to the Admin Dashboard, ${user.username}!`,
      userData: {
        username: user.username,
        level: user.level,
        lastLogin: new Date().toISOString(),
      },
      data: {
        cabang: cabang,
        orders: await Promise.all(
          orders.map(
            async (order: {
              id: any;
              total: any;
              isDone: any;
              isPaid: any;
              Item: any[];
              meja: any;
            }) => {
              const meja = await prisma.meja.findFirst({
                where: { id: order.meja },
                select: { no: true },
              });

              return {
                id: order.id,
                meja: meja?.no ?? null,
                total: order.total,
                isDone: order.isDone,
                isPaid: order.isPaid,
                items: order.Item.map(
                  (item: {
                    price: any;
                    id: any;
                    menu: { name: any };
                    qty: any;
                    isDelivered: any;
                  }) => ({
                    id: item.id,
                    name: item.menu.name,
                    qty: item.qty,
                    price: item.price,
                    isDelivered: item.isDelivered,
                  })
                ),
              };
            }
          )
        ),
      },
    };
  } catch (error) {
    console.error("Admin dashboard API error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
});

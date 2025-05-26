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

    const parsedBody = bodySchema.parse(await readBody(event));

    let cabang = null;
    if (user.idCabang != null) {
      cabang = await prisma.cabang.findUnique({
        where: { id: user.idCabang },
      });
      if (cabang) {
        if (cabang.isOpen) {
          const order = prisma.order.create({
            data: {
              idMeja: parsedBody.idMeja,
              idUser: user.id,
              idCabang: user.idCabang,
              total: 0,
              isPaid: false,
              isDone: false,
            },
          });

          const baseUrl = process.env.BASE_URL || "http://localhost:3000";
          const token = jwt.sign(
            {
              idOrder: (await order).id,
              idMeja: (await order).idMeja,
              idCabang: cabang.id,
            },
            jwtSecret,
            { expiresIn: "12h", issuer: baseUrl }
          );

          const originalData = `${expectedIssuer}/order/${
            (await order).id
          }/?token=${token}`;
          // 2. Generate the QR code as a Buffer (bytes)
          let qrCodeBuffer: Buffer;
          try {
            qrCodeBuffer = await QRCodeGenerator.toBuffer(originalData, {
              errorCorrectionLevel: "H", // High error correction
              type: "png", // Specify output type as png for buffer
              margin: 2,
              scale: 8, // Size of the QR code modules
            });
          } catch (qrError: any) {
            console.error("QR Code generation failed:", qrError);
            return internalServerErrorResponse(event);
          }

          if (!qrCodeBuffer || qrCodeBuffer.length === 0) {
            return internalServerErrorResponse(event);
          }

          const updatedOrder = await prisma.order.update({
            where: { id: (await order).id },
            data: {
              qrCode: qrCodeBuffer,
            },
          });

          setResponseStatus(event, 200);
          return {
            success: true,
            message: "Berhasil membuat order.",
            data: {
              qrCode: `data:image/png;base64,${qrCodeBuffer.toString(
                "base64"
              )}`,
            },
          };
        }
      }
    }

    setResponseStatus(event, 400);
    return {
      success: false,
      message: "Bad request.",
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

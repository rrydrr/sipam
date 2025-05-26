import prisma from "~/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = loginSchema.parse(await readBody(event));

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.password)) ||
      !user.isActive
    ) {
      setResponseStatus(event, 401);
      return {
        success: false,
        message: "Invalid credentials.",
      };
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in environment variables.");
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "Internal server error.",
      };
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const token = jwt.sign(
      { idUser: user.id, username: user.username },
      jwtSecret,
      { expiresIn: "12h", issuer: baseUrl }
    );

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Login successful!",
      token: token,
    };
  } catch (e) {
    if (e instanceof z.ZodError) {
      setResponseStatus(event, 400);
      return {
        success: false,
        message: "Invalid request body.",
        errors: e.errors,
      };
    } else {
      console.error("Auth login API error:", (e as Error).message);
      setResponseStatus(event, 500);
      return {
        success: false,
        message: "An unexpected error occurred.",
        // error: (e as Error).message,
      };
    }
  }
});

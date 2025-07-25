import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/authOptions";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const photos = await prisma.photo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  // Parse JSON fields for frontend compatibility
  const result = photos.map((photo: Record<string, unknown>) => ({
    ...photo,
    filtersApplied: photo.filtersApplied ?? { basic: [], advanced: {} },
    stickers: photo.stickers ?? [],
    metadata: photo.metadata ?? {},
  }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("TOKEN:", token); 
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: token.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const body = await req.json();
  const { imageUrl, filename, originalSrc, processedSrc, filtersApplied, stickers, size, metadata } = body;
  if (!imageUrl) return NextResponse.json({ error: "Missing photo url" }, { status: 400 });
  const photo = await prisma.photo.create({
    data: {
      userId: user.id,
      imageUrl,
      filename: filename ?? null,
      originalSrc: originalSrc ?? null,
      processedSrc: processedSrc ?? null,
      filtersApplied: filtersApplied ?? null,
      stickers: stickers ?? null,
      size: size ?? null,
      metadata: metadata ?? null,
    },
  });
  return NextResponse.json(photo, { status: 201 });
}

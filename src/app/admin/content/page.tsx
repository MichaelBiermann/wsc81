import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminContentPage() {
  redirect("/admin/content/news");
}

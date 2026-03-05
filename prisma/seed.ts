import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SPONSORS = [
  { name: "Bauunternehmung Michael Schneider", websiteUrl: "http://www.schneider-walldorf.de/", imageUrl: "/images/sponsors/bauunternehmung-schneider.png", displayOrder: 1 },
  { name: "Weine und Genuss", websiteUrl: "https://www.weine-und-genuss.de/weinladen_walldorf.html", imageUrl: "/images/sponsors/weine-und-genuss.png", displayOrder: 2 },
  { name: "Metzgerei Pütz", websiteUrl: "https://www.metzgerei-walldorf.de", imageUrl: "/images/sponsors/metzgerei-puetz.jpg", displayOrder: 3 },
  { name: "StefanMayerreisen", websiteUrl: "https://stefan-mayer-reisen.de/", imageUrl: "/images/sponsors/stefan-mayer-reisen.webp", displayOrder: 4 },
  { name: "Getränke Wipfler Walldorf", websiteUrl: "https://www.getraenke-wipfler.de", imageUrl: "/images/sponsors/getraenke-wipfler.jpg", displayOrder: 5 },
  { name: "Der Brillenladen", websiteUrl: "https://www.derbrillenladen-walldorf.de/", imageUrl: "/images/sponsors/brillenladen.png", displayOrder: 6 },
  { name: "Sparkasse", websiteUrl: "https://www.sparkasse-heidelberg.de", imageUrl: "/images/sponsors/sparkasse.png", displayOrder: 7 },
  { name: "Volksbank Kraichgau", websiteUrl: "https://www.vbkraichgau.de", imageUrl: "/images/sponsors/volksbank-kraichgau.jpg", displayOrder: 8 },
  { name: "Tari Bikes", websiteUrl: "https://www.tari-bikes.de/", imageUrl: "/images/sponsors/tari-bikes.jpg", displayOrder: 9 },
  { name: "Pfälzer Hof", websiteUrl: "https://www.pfaelzer-hof-walldorf.de/", imageUrl: "/images/sponsors/pfaelzer-hof.jpg", displayOrder: 10 },
  { name: "Astoria Apotheke", websiteUrl: "https://www.central-apotheke-walldorf.de", imageUrl: "/images/sponsors/astoria-apotheke.jpg", displayOrder: 11 },
];

async function main() {
  console.log("Seeding sponsors...");
  for (const s of SPONSORS) {
    await prisma.sponsor.upsert({
      where: { id: s.name }, // use name as pseudo-key; will create new if not found
      update: s,
      create: s,
    });
  }

  console.log("Creating default admin user...");
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@wsc81.de" },
    update: {},
    create: { email: "admin@wsc81.de", passwordHash, name: "Administrator" },
  });

  console.log("Seeding ClubSettings...");
  const existing = await prisma.clubSettings.findFirst();
  if (!existing) {
    await prisma.clubSettings.create({
      data: {
        bankName: "", ibanEncrypted: "", ibanLast4: "", bic: "",
        feeCollectionDay: 1, feeCollectionMonth: 10,
      },
    });
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

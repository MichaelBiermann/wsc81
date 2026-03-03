import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SPONSORS = [
  { name: "Bauunternehmung Michael Schneider", websiteUrl: "http://www.schneider-walldorf.de/", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/4/Bauunternehmnung_Schneider.png", displayOrder: 1 },
  { name: "Weine und Genuss", websiteUrl: "https://www.weine-und-genuss.de/weinladen_walldorf.html", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/6/Wein_Genuss_Logo.png", displayOrder: 2 },
  { name: "Metzgerei Pütz", websiteUrl: "https://www.metzgerei-walldorf.de", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/8/Metzgerei_P_tz.jpg", displayOrder: 3 },
  { name: "StefanMayerreisen", websiteUrl: "https://stefan-mayer-reisen.de/", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/0/StefanMayer_2.webp", displayOrder: 4 },
  { name: "Getränke Wipfler Walldorf", websiteUrl: "https://www.getraenke-wipfler.de", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/2/Wipfler.jpg", displayOrder: 5 },
  { name: "Der Brillenladen", websiteUrl: "https://www.derbrillenladen-walldorf.de/", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/4/Brillentante_Logo.png", displayOrder: 6 },
  { name: "Sparkasse", websiteUrl: "https://www.sparkasse-heidelberg.de", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/0/Sparkasse_NEW.png", displayOrder: 7 },
  { name: "Volksbank Kraichgau", websiteUrl: "https://www.vbkraichgau.de", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/2/Volksbank_Kraichgau.jpg", displayOrder: 8 },
  { name: "Tari Bikes", websiteUrl: "https://www.tari-bikes.de/", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/4/Tari_Bikes-001.jpg", displayOrder: 9 },
  { name: "Pfälzer Hof", websiteUrl: "https://www.pfaelzerhofwalldorf.de/", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/6/Pf_lzer_Hof-001.jpg", displayOrder: 10 },
  { name: "Astoria Apotheke", websiteUrl: "https://www.central-apotheke-walldorf.de", imageUrl: "https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/8/Apotheke.jpg", displayOrder: 11 },
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

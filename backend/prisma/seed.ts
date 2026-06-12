import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Active placement season.
  const season = await prisma.placementSeason.upsert({
    where: { name: "2024-25" },
    update: {},
    create: { name: "2024-25", isActive: true },
  });

  // Branches.
  const branches: Record<string, string> = {
    CSE: "Computer Science & Engineering",
    ECE: "Electronics & Communication Engineering",
    EE: "Electrical Engineering",
    ME: "Mechanical Engineering",
    CE: "Civil Engineering",
    Chemical: "Chemical Engineering",
    MME: "Metallurgical & Materials Engineering",
  };
  for (const [code, name] of Object.entries(branches)) {
    await prisma.branch.upsert({ where: { code }, update: {}, create: { code, name } });
  }

  // Programmes.
  await prisma.program.upsert({
    where: { code: "BTECH" },
    update: {},
    create: { code: "BTECH", name: "Bachelor of Technology", durationYears: 4 },
  });

  // Approved logins: the CCDC admin as super_admin, any institute address as student.
  await prisma.approvedEmail.upsert({
    where: { value: "web_ccdc@iitp.ac.in" },
    update: {},
    create: { kind: "exact", value: "web_ccdc@iitp.ac.in", roleHint: "super_admin" },
  });
  await prisma.approvedEmail.upsert({
    where: { value: "iitp.ac.in" },
    update: {},
    create: { kind: "domain", value: "iitp.ac.in", roleHint: "student" },
  });

  // Sample company + recruiter (provisioned by the TPC) so the magic-link login
  // can be tested: POST /auth/recruiter/request { "email": "hr@techflow.com" }.
  const company = await prisma.company.upsert({
    where: { slug: "techflow" },
    update: {},
    create: { name: "TechFlow Solutions Inc.", slug: "techflow", industry: "Software" },
  });
  const recruiterUser = await prisma.user.upsert({
    where: { email: "hr@techflow.com" },
    update: {},
    create: {
      email: "hr@techflow.com",
      fullName: "TechFlow Recruiting",
      role: "company",
      status: "active",
      authProvider: "email",
    },
  });
  await prisma.recruiter.upsert({
    where: { userId: recruiterUser.id },
    update: {},
    create: { userId: recruiterUser.id, companyId: company.id, designation: "HR Manager" },
  });

  console.log(
    `Seeded season ${season.name}, ${Object.keys(branches).length} branches, + sample recruiter hr@techflow.com`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Reference data + a realistic dev dataset so every role's pages have content.
 * Idempotent (upserts keyed on unique columns). Dev sessions for any seeded
 * user: GET /auth/dev/login?email=... (development only).
 */
async function main() {
  // --- Season -----------------------------------------------------------------
  const season = await prisma.placementSeason.upsert({
    where: { name: "2024-25" },
    update: { isActive: true },
    create: { name: "2024-25", isActive: true },
  });

  // --- Branches / programs -----------------------------------------------------
  const branchDefs: Record<string, string> = {
    CSE: "Computer Science & Engineering",
    ECE: "Electronics & Communication Engineering",
    EE: "Electrical Engineering",
    ME: "Mechanical Engineering",
    CE: "Civil Engineering",
    Chemical: "Chemical Engineering",
    MME: "Metallurgical & Materials Engineering",
  };
  const branches: Record<string, { id: string }> = {};
  for (const [code, name] of Object.entries(branchDefs)) {
    branches[code] = await prisma.branch.upsert({ where: { code }, update: {}, create: { code, name } });
  }
  const btech = await prisma.program.upsert({
    where: { code: "BTECH" },
    update: {},
    create: { code: "BTECH", name: "Bachelor of Technology", durationYears: 4 },
  });

  // --- Approved logins ----------------------------------------------------------
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

  // --- Skills --------------------------------------------------------------------
  const skillNames = ["C++", "Java", "Python", "React", "SQL", "System Design", "ML", "AWS"];
  const skills: Record<string, { id: string }> = {};
  for (const name of skillNames) {
    skills[name] = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }

  // --- Users: staff -----------------------------------------------------------------
  const upsertUser = (email: string, fullName: string, role: Prisma.UserCreateInput["role"]) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role, status: "active", authProvider: "email" },
    });

  const coordinatorUser = await upsertUser("coordinator@iitp.ac.in", "Aarav Mehta", "coordinator");
  const coordinator = await prisma.coordinator.upsert({
    where: { userId: coordinatorUser.id },
    update: {},
    create: { userId: coordinatorUser.id, department: "CCDC", phone: "+91 91234 56789" },
  });
  await upsertUser("admin@iitp.ac.in", "Dr. R. K. Singh", "admin");

  // --- Companies + recruiters ----------------------------------------------------------
  const techflow = await prisma.company.upsert({
    where: { slug: "techflow" },
    update: { location: "Bangalore, India" },
    create: {
      name: "TechFlow Solutions Inc.",
      slug: "techflow",
      industry: "Software",
      location: "Bangalore, India",
      website: "https://techflow.example.com",
    },
  });
  const recruiterUser = await upsertUser("hr@techflow.com", "TechFlow Recruiting", "company");
  await prisma.recruiter.upsert({
    where: { userId: recruiterUser.id },
    update: {},
    create: { userId: recruiterUser.id, companyId: techflow.id, designation: "HR Manager" },
  });
  await prisma.companyPoc.createMany({
    skipDuplicates: true,
    data: [
      {
        companyId: techflow.id,
        name: "Aarav Mehta",
        designation: "Placement Coordinator",
        phone: "+91 98765 43210",
        email: "coordinator.tpc@iitp.ac.in",
        isPrimary: true,
      },
    ],
  });

  const finserve = await prisma.company.upsert({
    where: { slug: "finserve" },
    update: {},
    create: {
      name: "FinServe Capital",
      slug: "finserve",
      industry: "Finance",
      location: "Mumbai, India",
    },
  });

  // --- Students -----------------------------------------------------------------------
  const studentDefs = [
    { email: "aarav_2101cs02@iitp.ac.in", name: "Aarav Sharma", roll: "2101CS02", branch: "CSE", cpi: 8.7, skills: ["C++", "React", "System Design"] },
    { email: "priya_2101cs18@iitp.ac.in", name: "Priya Nair", roll: "2101CS18", branch: "CSE", cpi: 9.1, skills: ["Java", "SQL", "AWS"] },
    { email: "rohan_2101ec11@iitp.ac.in", name: "Rohan Verma", roll: "2101EC11", branch: "ECE", cpi: 8.2, skills: ["Python", "ML"] },
    { email: "ananya_2101cs27@iitp.ac.in", name: "Ananya Iyer", roll: "2101CS27", branch: "CSE", cpi: 8.9, skills: ["Python", "SQL"] },
    { email: "karthik_2101ee05@iitp.ac.in", name: "Karthik Reddy", roll: "2101EE05", branch: "EE", cpi: 7.4, skills: ["C++"] },
    { email: "sneha_2101mm09@iitp.ac.in", name: "Sneha Gupta", roll: "2101MM09", branch: "MME", cpi: 8.4, skills: ["SQL", "Python"] },
  ];
  const students: Record<string, { id: string }> = {};
  for (const def of studentDefs) {
    const user = await upsertUser(def.email, def.name, "student");
    const branchId = branches[def.branch]!.id;
    const student = await prisma.student.upsert({
      where: { rollNo: def.roll },
      update: { cpi: def.cpi, branchId },
      create: {
        userId: user.id,
        rollNo: def.roll,
        branchId,
        programId: btech.id,
        batchYear: 2025,
        cpi: def.cpi,
        emailVerified: true,
        btechVerified: true,
        phone: "+91 98000 00000",
        preferredLocation: "Bangalore",
      },
    });
    students[def.roll] = student;
    for (const s of def.skills) {
      await prisma.studentSkill.upsert({
        where: { studentId_skillId: { studentId: student.id, skillId: skills[s]!.id } },
        update: {},
        create: { studentId: student.id, skillId: skills[s]!.id },
      });
    }
  }

  // --- Drives ------------------------------------------------------------------------
  const day = 24 * 60 * 60 * 1000;
  const inDays = (n: number) => new Date(Date.now() + n * day);

  async function upsertDrive(opts: {
    key: string;
    companyId: string;
    title: string;
    processType: "internship" | "six_month_fte" | "six_month_ppo" | "fte";
    ctcLpa: number;
    minCpi: number;
    status: "open" | "pending_approval" | "closed";
    deadlineDays: number;
    branchCodes: string[];
    skillNames: string[];
    openings?: number;
  }) {
    const existing = await prisma.drive.findFirst({
      where: { title: opts.title, companyId: opts.companyId },
    });
    if (existing) return existing;

    const drive = await prisma.drive.create({
      data: {
        seasonId: season.id,
        companyId: opts.companyId,
        title: opts.title,
        description: `${opts.title} role for the 2024-25 placement season.`,
        processType: opts.processType,
        location: "Bangalore",
        ctcLpa: opts.ctcLpa,
        minCpi: opts.minCpi,
        openings: opts.openings ?? 10,
        allowBacklog: false,
        status: opts.status,
        applicationDeadline: inDays(opts.deadlineDays),
        driveEligibleBranches: {
          createMany: { data: opts.branchCodes.map((c) => ({ branchId: branches[c]!.id })) },
        },
        driveEligiblePrograms: { create: { programId: btech.id } },
        driveSkills: {
          createMany: { data: opts.skillNames.map((s) => ({ skillId: skills[s]!.id })) },
        },
        driveStages: {
          createMany: {
            data: [
              { type: "registration", sequence: 1, status: "completed", scheduledAt: inDays(-7) },
              { type: "ppt", sequence: 2, status: "ongoing", scheduledAt: inDays(2), location: "Senate Hall" },
              { type: "online_assessment", sequence: 3, status: "upcoming", scheduledAt: inDays(5), location: "Computer Centre" },
              { type: "interview", sequence: 4, status: "upcoming", scheduledAt: inDays(10) },
              { type: "offer", sequence: 5, status: "upcoming", scheduledAt: inDays(14) },
            ],
          },
        },
      },
    });
    return drive;
  }

  const driveSde = await upsertDrive({
    key: "sde",
    companyId: techflow.id,
    title: "Software Development Engineer",
    processType: "fte",
    ctcLpa: 32.5,
    minCpi: 8.0,
    status: "open",
    deadlineDays: 8,
    branchCodes: ["CSE", "ECE", "EE"],
    skillNames: ["C++", "System Design", "React"],
  });
  const driveAnalyst = await upsertDrive({
    key: "analyst",
    companyId: finserve.id,
    title: "Quantitative Analyst",
    processType: "six_month_fte",
    ctcLpa: 18,
    minCpi: 8.5,
    status: "open",
    deadlineDays: 4,
    branchCodes: ["CSE", "ECE"],
    skillNames: ["Python", "SQL", "ML"],
  });
  await upsertDrive({
    key: "pending",
    companyId: finserve.id,
    title: "Risk Analyst (Intern)",
    processType: "internship",
    ctcLpa: 0,
    minCpi: 7.0,
    status: "pending_approval",
    deadlineDays: 15,
    branchCodes: ["CSE", "ECE", "EE", "ME"],
    skillNames: ["SQL"],
  });

  // Coordinator owns both open drives.
  for (const d of [driveSde, driveAnalyst]) {
    await prisma.coordinatorAssignment.upsert({
      where: { coordinatorId_driveId: { coordinatorId: coordinator.id, driveId: d.id } },
      update: {},
      create: { coordinatorId: coordinator.id, driveId: d.id },
    });
  }

  // --- Eligibility (inline compute so the catalogue works immediately) -------------
  const { computeForDrive } = await import("../src/modules/eligibility/service");
  await computeForDrive(driveSde.id);
  await computeForDrive(driveAnalyst.id);

  // --- An application + history -----------------------------------------------------
  const aarav = students["2101CS02"]!;
  const existingApp = await prisma.application.findUnique({
    where: { driveId_studentId: { driveId: driveSde.id, studentId: aarav.id } },
  });
  if (!existingApp) {
    await prisma.application.create({
      data: {
        driveId: driveSde.id,
        studentId: aarav.id,
        status: "shortlisted",
        isShortlisted: true,
        applicationStatusHistory: {
          createMany: {
            data: [{ status: "applied" }, { status: "shortlisted", note: "OA cleared" }],
          },
        },
      },
    });
  }

  // --- Credits (via ledger — the DB trigger maintains balances) ----------------------
  const creditCount = await prisma.creditTransaction.count({ where: { studentId: aarav.id } });
  if (creditCount === 0) {
    await prisma.creditTransaction.create({
      data: { studentId: aarav.id, seasonId: season.id, delta: 50, reason: "Season opening grant" },
    });
    await prisma.creditTransaction.create({
      data: { studentId: aarav.id, seasonId: season.id, delta: -10, reason: "Missed OA — TechFlow" },
    });
    await prisma.creditTransaction.create({
      data: {
        studentId: students["2101EE05"]!.id,
        seasonId: season.id,
        delta: 20,
        reason: "Season opening grant",
      },
    });
  }

  // --- Events --------------------------------------------------------------------------
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    const t = (h: number, m = 0) => new Date(Date.UTC(1970, 0, 1, h, m));
    await prisma.event.createMany({
      data: [
        {
          seasonId: season.id,
          type: "ppt",
          scope: "drive",
          driveId: driveSde.id,
          title: "TechFlow Pre-Placement Talk",
          eventDate: inDays(2),
          startTime: t(10),
          endTime: t(11, 30),
          location: "Senate Hall",
        },
        {
          seasonId: season.id,
          type: "oa",
          scope: "drive",
          driveId: driveSde.id,
          title: "TechFlow Online Assessment",
          eventDate: inDays(5),
          startTime: t(9),
          endTime: t(12),
          location: "Computer Centre Lab 1",
        },
        {
          seasonId: season.id,
          type: "deadline",
          scope: "global",
          title: "FinServe application deadline",
          eventDate: inDays(4),
        },
        {
          seasonId: season.id,
          type: "result",
          scope: "global",
          title: "Phase 1 shortlists announced",
          eventDate: inDays(7),
        },
      ],
    });
  }

  // --- Phase 2: contact log, registration + responses, logistics, notifications ---
  if ((await prisma.companyContactLog.count()) === 0) {
    await prisma.companyContactLog.createMany({
      data: [
        { companyId: techflow.id, contactName: "Anita Rao", designation: "HR Lead", channel: "call", note: "Confirmed PPT slot for Oct 15.", contactedOn: inDays(-3), recordedBy: coordinatorUser.id },
        { companyId: techflow.id, contactName: "Anita Rao", designation: "HR Lead", channel: "email", note: "Shared JD template.", contactedOn: inDays(-10), recordedBy: coordinatorUser.id },
        { companyId: finserve.id, contactName: "Vikram Sethi", designation: "Campus Recruiter", channel: "visit", note: "On-campus pre-talk discussion.", contactedOn: inDays(-5), recordedBy: coordinatorUser.id },
      ],
    });
  }

  if ((await prisma.companyRegistration.count()) === 0) {
    const reg = await prisma.companyRegistration.create({
      data: {
        seasonId: season.id,
        companyId: techflow.id,
        companyName: "TechFlow Solutions Inc.",
        industry: "Software",
        processType: "fte",
        minCpi: 7.5,
        registrationDeadline: inDays(10),
        status: "open",
        createdBy: coordinatorUser.id,
        registrationEligibleBranches: {
          createMany: { data: [{ branchId: branches.CSE!.id }, { branchId: branches.ECE!.id }] },
        },
      },
    });
    await prisma.registrationResponse.createMany({
      data: [
        { registrationId: reg.id, studentId: students["2101CS02"]!.id },
        { registrationId: reg.id, studentId: students["2101CS18"]!.id },
      ],
    });
  }

  if ((await prisma.logisticsRequest.count()) === 0) {
    const logi = await prisma.logisticsRequest.create({
      data: {
        companyId: techflow.id,
        seasonId: season.id,
        accommodationRequired: true,
        roomsRequired: 2,
        dietaryPreference: "Vegetarian options for 3",
        venuePreference: "Senate Hall",
        systemsRequired: 50,
        projectorRequired: true,
        internetRequired: true,
        technicalNotes: "Need a backup projector.",
        status: "submitted",
      },
    });
    await prisma.visitingTeamMember.createMany({
      data: [
        { logisticsRequestId: logi.id, name: "Anita Rao", designation: "HR Lead", phone: "+91 90000 11111", email: "anita@techflow.com" },
        { logisticsRequestId: logi.id, name: "Suresh K", designation: "Engineering Manager", phone: "+91 90000 22222" },
      ],
    });
  }

  if ((await prisma.notification.count()) === 0) {
    const aaravUserId = (await prisma.student.findUnique({
      where: { id: students["2101CS02"]!.id },
      select: { userId: true },
    }))!.userId;
    await prisma.notification.createMany({
      data: [
        { userId: aaravUserId, category: "status", title: "Application shortlisted", message: "You've been shortlisted for TechFlow — Software Development Engineer.", link: "/student-dashboard" },
        { userId: aaravUserId, category: "deadline", title: "Deadline approaching", message: "FinServe application closes in 4 days.", link: "/drive-catalogue" },
        { userId: coordinatorUser.id, category: "drive", title: "Drive awaiting approval", message: "FinServe — Risk Analyst (Intern) needs TPC review.", link: "/admin-dashboard", isRead: true },
      ],
    });
  }

  console.log(
    `Seeded: season ${season.name}, ${Object.keys(branchDefs).length} branches, ` +
      `${studentDefs.length} students, 2 companies, 3 drives (+eligibility), events, credits, ` +
      `+ phase-2 (contacts, registration, logistics, notifications).`
  );
  console.log(
    "Dev sessions: /auth/dev/login?email=aarav_2101cs02@iitp.ac.in | coordinator@iitp.ac.in | admin@iitp.ac.in | hr@techflow.com"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

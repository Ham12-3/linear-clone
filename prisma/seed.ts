import { PrismaClient, Priority, StatusCategory, ProjectStatus, CycleStatus } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

const names = ["Abdulhamid Sonaike", "Maya Chen", "Jon Bell", "Priya Nair", "Noah Williams", "Sofia Rossi", "Ibrahim Diallo", "Elena Martín"];
const issueTitles = [
  "Reduce global search time below 100ms", "Add fuzzy matching for issue identifiers", "Index comment bodies for workspace search", "Design empty states for new workspaces", "Fix stale assignee after rapid updates", "Add keyboard navigation to issue rows", "Create billing usage breakdown", "Improve mobile navigation hierarchy", "Add passkey-ready session architecture", "Prevent duplicate invitation acceptance",
];

async function main() {
  const demoPasswordHash = await hashPassword("OrbitDemo2026");
  const verifiedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.workspace.deleteMany({ where: { slug: "acme" } });
    const users = await Promise.all(names.map((name, index) => tx.user.upsert({
      where: { email: `member${index + 1}@orbit.local` },
      update: { name, passwordHash: demoPasswordHash, emailVerified: verifiedAt },
      create: {
        email: `member${index + 1}@orbit.local`,
        name,
        username: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, ""),
        passwordHash: demoPasswordHash,
        emailVerified: verifiedAt,
      },
    })));
    const workspace = await tx.workspace.create({ data: { name: "Orbit Labs", slug: "acme", icon: "O", description: "A realistic product workspace for local development." } });
    await tx.workspaceMember.createMany({ data: users.map((user, index) => ({ workspaceId: workspace.id, userId: user.id, role: index === 0 ? "OWNER" : index < 3 ? "ADMIN" : "MEMBER" })) });
    const team = await tx.team.create({ data: { workspaceId: workspace.id, name: "Engineering", key: "ENG", color: "#6d5ce8", issueCounter: 50 } });
    const statusSeeds = [
      ["Backlog", "#8c9099", StatusCategory.BACKLOG], ["Todo", "#727783", StatusCategory.UNSTARTED], ["In progress", "#6659d9", StatusCategory.STARTED], ["In review", "#d38a32", StatusCategory.STARTED], ["Done", "#2b9a73", StatusCategory.COMPLETED],
    ] as const;
    const statuses = await Promise.all(statusSeeds.map(([name, color, category], position) => tx.issueStatus.create({ data: { teamId: team.id, name, color, category, position } })));
    const project = await tx.project.create({ data: { workspaceId: workspace.id, name: "Search V2", summary: "Make finding work feel instantaneous.", color: "#6d5ce8", status: ProjectStatus.IN_PROGRESS, targetDate: new Date("2026-09-30") } });
    const cycle = await tx.cycle.create({ data: { workspaceId: workspace.id, teamId: team.id, name: "Cycle 14", number: 14, startsAt: new Date("2026-08-12"), endsAt: new Date("2026-08-26"), status: CycleStatus.ACTIVE } });
    for (let index = 0; index < 50; index += 1) {
      await tx.issue.create({ data: { workspaceId: workspace.id, teamId: team.id, number: index + 1, title: issueTitles[index % issueTitles.length], description: { type: "doc", content: [] }, statusId: statuses[index % statuses.length].id, priority: [Priority.HIGH, Priority.MEDIUM, Priority.LOW, Priority.URGENT, Priority.NONE][index % 5], assigneeId: users[index % users.length].id, creatorId: users[(index + 1) % users.length].id, projectId: index % 5 === 0 ? null : project.id, cycleId: index % 4 === 0 ? null : cycle.id, rank: (index + 1) * 1000 } });
    }
  }, { timeout: 30_000 });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

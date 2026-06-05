import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const baselineUsers = [
  { email: "owner@tufsports.us", full_name: "Coach Bradshaw", role: "OWNER", pin: "0000" },
  { email: "primeau.director@tufsports.us", full_name: "Primeau Hill Director", role: "DIRECTOR", pin: "8642" },
  { email: "test.director@tufsports.us", full_name: "Test Director", role: "DIRECTOR", pin: "2468" },
  { email: "test.rep@tufsports.us", full_name: "Test Rep", role: "REP", pin: "1357" },
]

async function clearDemoDataWhenExplicitlyAllowed() {
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    console.log("Skipping destructive cleanup. Set ALLOW_DESTRUCTIVE_SEED=true only in disposable demo/test databases.")
    return
  }

  console.log("Deleting existing demo data from disposable database...")
  await prisma.repActivity.deleteMany({})
  await prisma.opportunityNote.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.uniformOrderLine.deleteMany({})
  await prisma.rosterRow.deleteMany({})
  await prisma.rosterUpload.deleteMany({})
  await prisma.uniformOrder.deleteMany({})
  await prisma.mockupVersion.deleteMany({})
  await prisma.mockup.deleteMany({})
  await prisma.sampleRequest.deleteMany({})
  await prisma.storeProductPricing.deleteMany({})
  await prisma.fundraisingPayout.deleteMany({})
  await prisma.teamStore.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.ordersRaw.deleteMany({})
  await prisma.teamAsset.deleteMany({})
  await prisma.opportunity.deleteMany({})
  await prisma.team.deleteMany({})
  await prisma.contact.deleteMany({})
  await prisma.organization.deleteMany({})
}

async function main() {
  console.log("Starting V0.8.5 baseline seed...")
  await clearDemoDataWhenExplicitlyAllowed()

  for (const user of baselineUsers) {
    const password_hash = await bcrypt.hash(user.pin, 10)
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password_hash,
        full_name: user.full_name,
        role: user.role,
      },
      create: {
        email: user.email,
        password_hash,
        full_name: user.full_name,
        role: user.role,
      },
    })
  }

  console.log(`Seeded/updated ${baselineUsers.length} approved rollout users.`)
  console.log("V0.8.5 seed finished.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

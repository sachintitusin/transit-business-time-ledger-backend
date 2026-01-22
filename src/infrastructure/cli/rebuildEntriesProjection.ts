import "dotenv/config";
import { PrismaTransactionManager } from "../prisma/PrismaTransactionManager";
import { RebuildEntriesProjectionService } from "../../application/services/entries/RebuildEntriesProjectionService";
import { transactionContext } from "../prisma/transactionContext";

async function main() {
  const txManager = new PrismaTransactionManager();
  const service = new RebuildEntriesProjectionService();

  console.log("🔁 Rebuilding entries_projection…");

  await txManager.run(async () => {
    const db = transactionContext.get(); 
    await service.execute(db);
  });

  console.log("✅ entries_projection rebuild complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Rebuild failed");
    console.error(err);
    process.exit(1);
  });

import { prisma } from "@/core/db/client";

export default async function TestDatabasePage() {
  // Attempt to write and read from the database
  let dbStatus = "Testing...";
  let userCount = 0;

  try {
    userCount = await prisma.user.count();
    dbStatus = "✅ Database Connected Successfully!";
  } catch (error: unknown) {
    dbStatus = `❌ Database Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`;
  }

  return (
    <div className="p-10 font-mono">
      <h1 className="text-2xl font-bold mb-4">System Diagnostic</h1>
      <p className="text-lg">{dbStatus}</p>
      <p className="text-gray-500 mt-2">Total Users in DB: {userCount}</p>
    </div>
  );
}
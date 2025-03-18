import { RedisDashboard } from "@/components/redis-dashboard"


export const metadata = {
  title: "Redis Admin Dashboard",
  description: "Monitor and manage Redis cache for the sports betting application",
}

export default function RedisAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Redis Admin Dashboard</h1>
      <RedisDashboard />
    </div>
  )
}


import { useDiscover } from '~/hooks/usePromptX'
import { Sparkles, Users, Wrench } from 'lucide-react'

export default function HomePage() {
  const { data } = useDiscover()

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome to PromptX
          </h1>
          <p className="text-lg text-slate-600">
            AI Role & Tool Platform - Transform your AI into industry experts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Roles"
            value={data?.statistics.totalRoles || 0}
            description="Available expert roles"
            color="blue"
          />
          <StatCard
            icon={Wrench}
            title="Tools"
            value={data?.statistics.totalTools || 0}
            description="Functional tools"
            color="green"
          />
          <StatCard
            icon={Sparkles}
            title="Active"
            value={data ? 1 : 0}
            description="PromptX instances"
            color="purple"
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Start</h2>
          <div className="space-y-4">
            <Step
              number={1}
              title="Discover Experts"
              description="Browse available roles and tools in the Roles and Tools tabs"
            />
            <Step
              number={2}
              title="Activate a Role"
              description="Select and activate an expert role that matches your needs"
            />
            <Step
              number={3}
              title="Start Working"
              description="Use the activated role's expertise and tools to accomplish your tasks"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard
            title="Natural Conversation"
            description="Chat with AI as if talking to a real expert - no complex commands needed"
          />
          <FeatureCard
            title="Memory Network"
            description="AI remembers context and builds knowledge networks for better assistance"
          />
          <FeatureCard
            title="Role Creation"
            description="Create custom roles with Nuwa - transform AI into any specialist you need"
          />
          <FeatureCard
            title="Tool Integration"
            description="Build tools with Luban - connect any API or service in minutes"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, description, color }: any) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-900 mb-1">{title}</div>
      <div className="text-sm text-slate-500">{description}</div>
    </div>
  )
}

function Step({ number, title, description }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold">
        {number}
      </div>
      <div>
        <div className="font-medium text-slate-900 mb-1">{title}</div>
        <div className="text-sm text-slate-600">{description}</div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description }: any) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-300 transition-colors">
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}
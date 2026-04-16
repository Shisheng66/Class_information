import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { StudentStats } from '../types';

const PIE_COLORS = ['#2563eb', '#ec4899'];

interface DashboardViewProps {
  stats: StudentStats;
}

const TEXT = {
  total: '\u5b66\u751f\u603b\u6570',
  male: '\u7537\u751f\u4eba\u6570',
  female: '\u5973\u751f\u4eba\u6570',
  averageAge: '\u5e73\u5747\u5e74\u9f84',
  genderRatio: '\u7537\u5973\u6bd4\u4f8b',
  gradeDistribution: '\u5404\u5e74\u7ea7\u4eba\u6570',
  countLabel: '\u4eba\u6570',
  personSuffix: '\u4eba',
};

export default function DashboardView({ stats }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{TEXT.total}</p><p className="mt-3 text-3xl font-bold">{stats.total}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{TEXT.male}</p><p className="mt-3 text-3xl font-bold">{stats.male}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{TEXT.female}</p><p className="mt-3 text-3xl font-bold">{stats.female}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{TEXT.averageAge}</p><p className="mt-3 text-3xl font-bold">{stats.averageAge.toFixed(1)}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">{TEXT.genderRatio}</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.genderDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={88}
                  label={({ name, percent }) => (percent ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                >
                  {stats.genderDistribution.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} ${TEXT.personSuffix}`, TEXT.countLabel]} />
                <Legend verticalAlign="bottom" height={32} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">{TEXT.gradeDistribution}</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} ${TEXT.personSuffix}`, TEXT.countLabel]} />
                <Bar dataKey="count" fill="#7c3aed" radius={[10, 10, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

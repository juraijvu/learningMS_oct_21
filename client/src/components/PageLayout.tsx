import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageLayout({ children, title, subtitle, action }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">{title}</h1>
            {subtitle && <p className="text-blue-700 font-medium mt-2">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
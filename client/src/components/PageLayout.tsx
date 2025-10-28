import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageLayout({ children, title, subtitle, action }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-2 sm:p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-200/50 shadow-lg gap-3 md:gap-4">
          <div className="flex-1 min-w-0 w-full md:w-auto">
            <h1 className="text-lg sm:text-xl md:text-4xl font-bold text-blue-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm md:text-base text-blue-700 font-medium mt-1 md:mt-2 truncate">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0 w-full md:w-auto">{action}</div>}
        </div>
        <div className="overflow-x-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
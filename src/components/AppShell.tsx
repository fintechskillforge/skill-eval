import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/eval", label: "评测概览", end: true },
  { to: "/eval/baseline", label: "评测基准", end: true },
  { to: "/eval/baseline/diff", label: "版本对比", end: false },
  { to: "/eval/reports", label: "评测报告", end: false },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-page items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs text-muted">Skill 平台 · 质量治理</p>
            <p className="text-[20px] font-semibold leading-8">评测门禁</p>
          </div>
          <p className="text-xs text-muted">平台运营 / 技能作者 / 合规</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-page grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 md:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-[6px] px-3 py-2 text-sm ${
                  isActive ? "bg-[#E6F4FF] font-semibold text-primary" : "text-ink hover:bg-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

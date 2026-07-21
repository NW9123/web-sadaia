import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/** Marketing / standard page shell: header + content + footer. */
export function AppShell({
  children,
  footer = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {footer && <SiteFooter />}
    </div>
  );
}

/** Workspace shell: header only, full-height content (no footer). */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

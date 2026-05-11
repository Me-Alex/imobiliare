import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
export function AppShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen flex bg-bg-primary text-text-primary"><Sidebar /><div className="flex-1 flex flex-col"><Topbar /><main className="flex-1 p-4 md:p-6">{children}</main></div></div> }
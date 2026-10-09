import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/bff/auth/page-session";
import { staffHome } from "@/lib/auth/staff-contract";
export default async function PanelPage() { const employee = await requireStaff(); redirect(staffHome(employee)); }
"use client";
import UnifiedLogin from "@/components/public/UnifiedLogin";
import { Suspense } from "react";
export default function LoginPage() { return <Suspense fallback={null}><UnifiedLogin initialStaff /></Suspense>; }

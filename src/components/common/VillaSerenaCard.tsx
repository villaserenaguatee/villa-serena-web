"use client";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
/** Shared public-booking card preview. Never persists form data. */
export default function VillaSerenaCard({ numero = "", titular = "", vencimiento = "", marca = "" }: { numero?: string; titular?: string; vencimiento?: string; marca?: string }) {
  const { en } = usePublicLanguage();
  return <div className="visual-card">
    <div className="visual-card-top"><b>VILLA SERENA</b><span>HOTEL</span></div>
    <div className="flex items-center gap-3"><div className="visual-chip" /><span className="text-xs">{marca}</span></div>
    <strong>{numero || "•••• •••• •••• ••••"}</strong>
    <div className="visual-card-bottom"><span className="min-w-0"><small>{en ? "CARDHOLDER" : "TITULAR"}</small><span className="truncate">{titular || (en ? "CARDHOLDER NAME" : "NOMBRE DEL TITULAR")}</span></span><span className="shrink-0"><small>{en ? "VALID THRU" : "VÁLIDA HASTA"}</small>{vencimiento || "MM/AA"}</span></div>
  </div>;
}

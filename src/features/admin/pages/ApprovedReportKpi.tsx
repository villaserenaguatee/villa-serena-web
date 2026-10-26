import AdminMetric from './AdminMetric';
export default function Kpi({ valor, label, detalle }: {
  valor: string;
  label: string;
  detalle?: string;
  destacado?: boolean;
}) {
  return <AdminMetric label={label} value={valor} detail={detalle??''} detailAsInfo/>;
}

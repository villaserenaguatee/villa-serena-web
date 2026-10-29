import type {ReactNode} from 'react';

type Row={id:number;version:number;[key:string]:unknown};
export default function CatalogTable({rows,columns,onEdit}:{rows:Row[];columns:{key:string;label:string;value:(row:Row)=>ReactNode}[];onEdit:(row:Row)=>void}) {
  return <div className="max-w-full overflow-x-auto rounded-xl border border-[#E0E3E7] bg-white"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr>{columns.map(column=><th scope="col" key={column.key} className="bg-[#FAFBFC] px-4 py-3 text-xs font-semibold  tracking-wide text-[#536579]">{column.label}</th>)}<th scope="col" className="px-4 py-3">Acciones</th></tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t border-[#EDF0F2]"><td className="px-4 py-3 font-semibold">{columns[0].value(row)}</td>{columns.slice(1).map(column=><td key={column.key} className="px-4 py-3">{column.value(row)}</td>)}<td className="px-4 py-3"><button type="button" onClick={()=>onEdit(row)} className="rounded-md border border-[#D8DFE5] bg-white px-3 py-2 hover:bg-[#F1F5F8]">Editar</button></td></tr>)}</tbody></table></div>;
}

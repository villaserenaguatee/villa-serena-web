import ReceptionCloseButton from './ReceptionCloseButton';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DocumentoCargado, Huesped, Reserva } from '@/lib/pms/types';

export function etiquetaDocumento(documento: DocumentoCargado, tipo: Huesped['tipoDocumento'], indice: number, total: number) {
  if (tipo === 'DPI') {
    if (documento.lado === 'frente' || (!documento.lado && indice === 0)) return 'Frente del DPI';
    if (documento.lado === 'reverso' || (!documento.lado && indice === 1)) return 'Reverso del DPI';
    return `DPI · fotografía ${indice + 1}`;
  }
  return total === 1 ? 'Pasaporte' : `Pasaporte · fotografía ${indice + 1}`;
}

function Miniatura({ documento, etiqueta, onAbrir, onReenviar }: {
  documento: DocumentoCargado;
  etiqueta: string;
  onAbrir: () => void;
  onReenviar?: () => void;
}) {
  const [error, setError] = useState(false);
  const disponible = Boolean(documento.previewUrl) && !error;
  return <div className="min-w-0">
    <p className="mb-1 text-xs font-semibold text-[#18345C]">{etiqueta}</p>
    {disponible ? <button type="button" onClick={onAbrir} aria-label={`Ver ${etiqueta}`}
      className="block h-20 w-full overflow-hidden rounded-md border border-[#E5E0D8] bg-[#F8F6F0] focus-visible:outline-2 focus-visible:outline-[#18345C]">
      {documento.formato === 'PDF' ? <span className="text-xs font-semibold text-[#18345C]">Ver PDF</span> : <img
        src={documento.previewUrl} alt={etiqueta} onError={() => setError(true)} className="h-full w-full object-contain" />}
    </button> : <div className="rounded-md bg-[#FFF9E8] p-2 text-xs text-[#9A3412]">
      <p>Este archivo ya no está disponible.</p>
      {onReenviar && <button type="button" onClick={onReenviar} className="mt-1 font-semibold underline">Solicitar reenvío</button>}
    </div>}
    <p className="mt-1 truncate text-[11px] text-[#52677F]" title={documento.nombre}>{documento.nombre}</p>
  </div>;
}

function VisorDocumento({ documentos, etiquetas, inicial, onCerrar }: {
  documentos: DocumentoCargado[];
  etiquetas: string[];
  inicial: number;
  onCerrar: () => void;
}) {
  const [indice, setIndice] = useState(inicial);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(false);
  const dialogo = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const documento = documentos[indice];
  function cambiar(direccion: number) {
    setIndice(actual => (actual + direccion + documentos.length) % documentos.length);
    setZoom(1);
    setError(false);
    arrastre.current = null;
    area.current?.scrollTo(0, 0);
  }
  useEffect(() => {
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogo.current?.focus();
    function teclado(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCerrar();
      }
      if (event.key === 'Tab') {
        const botones = dialogo.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!botones?.length) return;
        const primero = botones[0];
        const ultimo = botones[botones.length - 1];
        if (event.shiftKey && (document.activeElement === primero || document.activeElement === dialogo.current)) {
          event.preventDefault();
          ultimo.focus();
        } else if (!event.shiftKey && document.activeElement === ultimo) {
          event.preventDefault();
          primero.focus();
        }
      }
    }
    document.addEventListener('keydown', teclado, true);
    return () => {
      document.removeEventListener('keydown', teclado, true);
      document.body.style.overflow = overflow;
      previo?.focus();
    };
  }, [onCerrar]);
  return createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071D34]/80 p-3 sm:p-6"
    onMouseDown={event => event.target === event.currentTarget && onCerrar()}>
    <div ref={dialogo} role="dialog" aria-modal="true" aria-label="Visor del documento de identidad" tabIndex={-1}
      className="flex h-[85dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D8] px-4 py-3">
        <div className="min-w-0"><p className="font-semibold text-[#18345C]">{etiquetas[indice]}</p>
          <p className="max-w-64 truncate text-xs text-[#52677F]">{documento.nombre}</p></div>
        <div className="flex items-center gap-2 text-[#18345C]">
          {documento.formato !== 'PDF' && <>
            <button type="button" aria-label="Alejar imagen" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="h-8 w-8 rounded-md border disabled:opacity-40">−</button>
            <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label="Acercar imagen" disabled={zoom >= 4} onClick={() => setZoom(z => Math.min(4, z + 0.5))} className="h-8 w-8 rounded-md border disabled:opacity-40">+</button>
          </>}
          <ReceptionCloseButton type="button" onClick={onCerrar} />
        </div>
      </div>
      <div ref={area} className={`min-h-0 flex-1 overflow-auto bg-[#F8F6F0] ${zoom > 1 ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
        onPointerDown={event => {
          if (zoom <= 1 || documento.formato === 'PDF') return;
          const elemento = event.currentTarget;
          arrastre.current = { x: event.clientX, y: event.clientY, left: elemento.scrollLeft, top: elemento.scrollTop };
          elemento.setPointerCapture(event.pointerId);
          event.preventDefault();
        }}
        onPointerMove={event => {
          const inicio = arrastre.current;
          if (!inicio) return;
          event.currentTarget.scrollLeft = inicio.left - (event.clientX - inicio.x);
          event.currentTarget.scrollTop = inicio.top - (event.clientY - inicio.y);
        }}
        onPointerUp={() => { arrastre.current = null; }} onPointerCancel={() => { arrastre.current = null; }}>
        {documento.previewUrl && !error ? documento.formato === 'PDF' ? <iframe src={documento.previewUrl} title={etiquetas[indice]} className="h-full w-full border-0" /> : <div
          className="grid place-items-center" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <img key={documento.previewUrl} src={documento.previewUrl} alt={etiquetas[indice]} draggable={false}
            onError={() => setError(true)} className="h-full w-full select-none object-contain" />
        </div> : <p className="p-6 text-center text-sm text-[#9A3412]">Este archivo ya no está disponible. Cierra el visor para solicitar su reenvío.</p>}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#E5E0D8] px-4 py-2 text-sm text-[#18345C]">
        <button type="button" disabled={documentos.length < 2} onClick={() => cambiar(-1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Anterior</button>
        <span>{indice + 1} / {documentos.length}</span>
        <button type="button" disabled={documentos.length < 2} onClick={() => cambiar(1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Siguiente</button>
      </div>
    </div>
  </div>, document.body);
}

export default function DocumentosCheckIn({ checkInWeb, tipoDocumento, onSolicitarReenvio }: {
  checkInWeb: NonNullable<Reserva['checkInWeb']>;
  tipoDocumento: Huesped['tipoDocumento'];
  onSolicitarReenvio?: (motivo: string) => void;
}) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const documentos = checkInWeb.documentos?.length ? checkInWeb.documentos : [checkInWeb.documento];
  const etiquetas = documentos.map((doc, indice) => etiquetaDocumento(doc, tipoDocumento, indice, documentos.length));
  return <div className="rounded-lg border border-[#DCE3EA] bg-white p-2">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#71839B]">Documento de identidad</p>
    <div className="grid grid-cols-2 gap-2">
      {documentos.map((doc, indice) => <Miniatura key={`${indice}-${doc.previewUrl ?? doc.nombre}`} documento={doc}
        etiqueta={etiquetas[indice]} onAbrir={() => setAbierto(indice)}
        onReenviar={onSolicitarReenvio ? () => onSolicitarReenvio(`Vuelve a enviar ${etiquetas[indice]} (${doc.nombre}): el archivo no está disponible.`) : undefined} />)}
    </div>
    {abierto !== null && <VisorDocumento documentos={documentos} etiquetas={etiquetas} inicial={abierto} onCerrar={() => setAbierto(null)} />}
  </div>;
}

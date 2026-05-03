'use client';

import { useState, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { fetchWithNexoAuth } from '@/lib/nexo/client';

interface ImportJob {
  id: number;
  fileName: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:               { label: 'Pendente',       color: 'text-[var(--muted)] bg-[var(--surface-2)]' },
  PROCESSING:            { label: 'Processando…',   color: 'text-[#1b4f8a] bg-[#eef6ff]' },
  COMPLETED:             { label: 'Concluído',       color: 'text-[var(--green)] bg-[var(--green-50)]' },
  COMPLETED_WITH_ERRORS: { label: 'Com erros',       color: 'text-[#8a6400] bg-[var(--amber-50)]' },
  FAILED:                { label: 'Falhou',          color: 'text-red-700 bg-red-100' },
};

export default function ImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadJobs() {
    const res = await fetchWithNexoAuth('/api/import');
    const d = await res.json();
    setJobs(d.jobs ?? []);
    setJobsLoaded(true);
  }

  async function handleFile(file: File) {
    setUploading(true);
    try {
      // Parse xlsx no cliente com SheetJS (importação dinâmica para evitar SSR)
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const rows = rawRows.map((r: unknown, i: number) => {
        const row = r as Record<string, unknown>;
        return {
          rowNumber: i + 2,
          productId: row['product_id'] ?? row['productId'] ?? row['ID do produto'] ?? '',
          blockType: row['block_type'] ?? row['blockType'] ?? row['Tipo de bloco'] ?? '',
          title: row['title'] ?? row['titulo'] ?? row['Título'] ?? '',
          content: row['content'] ?? row['conteudo'] ?? row['Conteúdo'] ?? '',
          order: Number(row['order'] ?? row['ordem'] ?? 0),
          effect: row['effect'] ?? row['efeito'] ?? 'NONE',
        };
      });

      const res = await fetchWithNexoAuth('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, rows }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadJobs();
    } catch (e) {
      alert('Erro ao processar a planilha. Verifique o formato e tente novamente.');
      console.error(e);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <AppShell
      title="Importação em massa"
      subtitle="Faça upload de uma planilha Excel (.xlsx) para aplicar blocos a múltiplos produtos de uma só vez."
      actions={[{ label: jobsLoaded ? 'Atualizar histórico' : 'Carregar histórico', onClick: loadJobs, variant: 'ghost' }]}
    >
        {/* Upload */}
        <div className="pp-card mb-8 p-6">
          <h2 className="font-display mb-4 text-xl font-bold">Upload da planilha</h2>
          <div className="rounded-[10px] border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-8 text-center">
            <p className="mb-3 text-sm text-[var(--muted)]">
              Formato esperado das colunas: <code className="rounded bg-white px-1 text-xs">product_id, block_type, title, content, order, effect</code>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className={`pp-btn pp-btn-primary cursor-pointer ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              {uploading ? 'Processando…' : 'Selecionar planilha'}
            </label>
          </div>
        </div>

        {/* Histórico */}
        <div className="pp-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
            <h2 className="font-display text-lg font-bold">Histórico de importações</h2>
            <button onClick={loadJobs} className="text-sm font-bold text-[var(--pink)] hover:text-[var(--pink-deep)]">
              {jobsLoaded ? 'Atualizar' : 'Carregar histórico'}
            </button>
          </div>
          {jobsLoaded && (
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
                <tr>
                  <th className="text-left px-6 py-3">Arquivo</th>
                  <th className="text-right px-6 py-3">Total</th>
                  <th className="text-right px-6 py-3">Processados</th>
                  <th className="text-right px-6 py-3">Erros</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {jobs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--muted)]">Nenhuma importação ainda.</td></tr>
                ) : jobs.map((job) => {
                  const st = STATUS_LABELS[job.status] ?? { label: job.status, color: 'text-gray-500 bg-gray-100' };
                  return (
                    <tr key={job.id}>
                      <td className="px-6 py-3 font-semibold text-[var(--foreground)]">{job.fileName}</td>
                      <td className="px-6 py-3 text-right">{job.totalRows}</td>
                      <td className="px-6 py-3 text-right">{job.processedRows}</td>
                      <td className="px-6 py-3 text-right">{job.errorRows}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
    </AppShell>
  );
}

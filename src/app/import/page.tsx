'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface ImportJob {
  id: number;
  fileName: string;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  status: string;
  createdAt: string;
}

function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-semibold text-gray-900">Product Page Builder</span>
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Analytics</Link>
      <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">Produtos</Link>
      <Link href="/import" className="text-sm text-blue-600 font-medium">Importar</Link>
      <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Configurações</Link>
    </nav>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:               { label: 'Pendente',       color: 'text-gray-500 bg-gray-100' },
  PROCESSING:            { label: 'Processando…',   color: 'text-blue-700 bg-blue-100' },
  COMPLETED:             { label: 'Concluído',       color: 'text-green-700 bg-green-100' },
  COMPLETED_WITH_ERRORS: { label: 'Com erros',       color: 'text-yellow-700 bg-yellow-100' },
  FAILED:                { label: 'Falhou',          color: 'text-red-700 bg-red-100' },
};

export default function ImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [jobsLoaded, setJobsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadJobs() {
    const res = await fetch('/api/import');
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

      const res = await fetch('/api/import', {
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Importação em massa</h1>
        <p className="text-sm text-gray-500 mb-8">
          Faça upload de uma planilha Excel (.xlsx) para aplicar blocos a múltiplos produtos de uma só vez.
        </p>

        {/* Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Upload da planilha</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Formato esperado das colunas: <code className="text-xs bg-gray-100 px-1 rounded">product_id, block_type, title, content, order, effect</code>
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
              className={`inline-block cursor-pointer bg-blue-600 text-white text-sm px-6 py-2 rounded-lg hover:bg-blue-700 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? 'Processando…' : 'Selecionar planilha'}
            </label>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Histórico de importações</h2>
            <button onClick={loadJobs} className="text-sm text-blue-600 hover:underline">
              {jobsLoaded ? 'Atualizar' : 'Carregar histórico'}
            </button>
          </div>
          {jobsLoaded && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left px-6 py-3">Arquivo</th>
                  <th className="text-right px-6 py-3">Total</th>
                  <th className="text-right px-6 py-3">Processados</th>
                  <th className="text-right px-6 py-3">Erros</th>
                  <th className="text-left px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma importação ainda.</td></tr>
                ) : jobs.map((job) => {
                  const st = STATUS_LABELS[job.status] ?? { label: job.status, color: 'text-gray-500 bg-gray-100' };
                  return (
                    <tr key={job.id}>
                      <td className="px-6 py-3 text-gray-900">{job.fileName}</td>
                      <td className="px-6 py-3 text-right">{job.totalRows}</td>
                      <td className="px-6 py-3 text-right">{job.processedRows}</td>
                      <td className="px-6 py-3 text-right">{job.errorRows}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

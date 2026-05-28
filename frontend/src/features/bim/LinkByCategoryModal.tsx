/**
 * LinkByCategoryModal — create one BOQ position per Revit element_type
 * from a set of BIM elements in a single action.
 *
 * Workflow:
 *  1. Groups input elements by element_type.
 *  2. Auto-suggests unit + quantity via suggestQuantityFromBIM (volume → area → length → pcs).
 *  3. User reviews the table, can toggle rows off, edit unit/description.
 *  4. On submit: creates BOQ positions sequentially then bulk-links all elements.
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { X, Check, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { boqApi, type BOQ } from '@/features/boq/api';
import { createLinksBulk, resolveElementUUID } from './api';
import type { BIMElementData } from '@/shared/ui/BIMViewer';
import { suggestQuantityFromBIM } from '@/features/boq/suggestQuantityFromBIM';
import { useToastStore } from '@/stores/useToastStore';

interface Props {
  projectId: string;
  modelId: string;
  elements: BIMElementData[];
  onClose: () => void;
  onLinked?: () => void;
}

interface CategoryRow {
  elementType: string;
  elements: BIMElementData[];
  unit: string;
  quantity: number;
  description: string;
  enabled: boolean;
}

function buildAutoOrdinal(existingOrdinals: string[], offset: number): string {
  let maxBim = 0;
  for (const o of existingOrdinals) {
    const m = /^BIM-(\d+)$/i.exec((o || '').trim());
    if (m) {
      const n = Number.parseInt(m[1]!, 10);
      if (n > maxBim) maxBim = n;
    }
  }
  return `BIM-${String(maxBim + 1 + offset).padStart(3, '0')}`;
}

export default function LinkByCategoryModal({ projectId, modelId, elements, onClose, onLinked }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  // ── Target BOQ ──────────────────────────────────────────────────────────
  const [selectedBOQId, setSelectedBOQId] = useState<string>('');

  const boqsQuery = useQuery({
    queryKey: ['boqs', projectId],
    queryFn: () => boqApi.list(projectId),
    enabled: !!projectId,
  });
  const boqs: BOQ[] = boqsQuery.data ?? [];

  const positionsQuery = useQuery({
    queryKey: ['boq-detail', selectedBOQId],
    queryFn: () => boqApi.get(selectedBOQId),
    enabled: !!selectedBOQId,
  });
  const existingOrdinals: string[] = positionsQuery.data?.positions?.map((p) => p.ordinal) ?? [];

  // ── Group elements by element_type ────────────────────────────────────
  const initialRows = useMemo<CategoryRow[]>(() => {
    const groups = new Map<string, BIMElementData[]>();
    for (const el of elements) {
      const key = el.element_type || 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(el);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length) // most elements first
      .map(([elementType, els]) => {
        const suggestion = suggestQuantityFromBIM(els, null);
        return {
          elementType,
          elements: els,
          unit: suggestion.inferredUnit || 'pcs',
          quantity: Math.round(suggestion.value * 100) / 100,
          description: elementType,
          enabled: true,
        };
      });
  }, [elements]);

  const [rows, setRows] = useState<CategoryRow[]>(initialRows);

  const updateRow = useCallback((idx: number, patch: Partial<CategoryRow>) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }, []);

  // Re-compute quantity when unit changes
  const handleUnitChange = useCallback((idx: number, newUnit: string) => {
    const row = rows[idx]!;
    const suggestion = suggestQuantityFromBIM(row.elements, newUnit);
    updateRow(idx, { unit: newUnit, quantity: Math.round(suggestion.value * 100) / 100 });
  }, [rows, updateRow]);

  const enabledRows = rows.filter((r) => r.enabled);

  // ── Submit ───────────────────────────────────────────────────────────
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedBOQId) throw new Error('No BOQ selected');

      const enabled = rows.filter((r) => r.enabled);
      setProgress({ done: 0, total: enabled.length });

      for (let i = 0; i < enabled.length; i++) {
        const row = enabled[i]!;

        // Create BOQ position
        const ordinal = buildAutoOrdinal(existingOrdinals, i);
        const newPos = await boqApi.addPosition({
          boq_id: selectedBOQId,
          ordinal,
          description: row.description,
          unit: row.unit,
          quantity: row.quantity,
          unit_rate: 0,
        });

        // Bulk-link all elements in this category
        const resolvedIds = await Promise.all(
          row.elements.map((el) => resolveElementUUID(modelId, el))
        );
        const payloads = resolvedIds.map((id) => ({
          boq_position_id: newPos.id,
          bim_element_id: id,
          link_type: 'manual' as const,
          confidence: 'high' as const,
        }));
        await createLinksBulk(payloads);

        setProgress({ done: i + 1, total: enabled.length });
      }
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: t('bim.link_by_cat_done', { defaultValue: 'BOQ positions created' }),
        message: t('bim.link_by_cat_done_msg', {
          defaultValue: '{{count}} positions linked to BIM elements',
          count: enabledRows.length,
        }),
      });
      qc.invalidateQueries({ queryKey: ['bim-elements'] });
      qc.invalidateQueries({ queryKey: ['boq-detail', selectedBOQId] });
      onLinked?.();
      onClose();
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: t('common.error', { defaultValue: 'Error' }), message: err.message });
      setProgress(null);
    },
  });

  const isRunning = mutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl mx-4 rounded-2xl bg-surface-elevated shadow-2xl border border-border-light flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-content-primary">
              {t('bim.link_by_category', { defaultValue: 'Link by Category' })}
            </h3>
            <p className="text-xs text-content-tertiary mt-0.5">
              {t('bim.link_by_category_sub', {
                defaultValue: 'Creates one BOQ position per Revit category',
              })}
            </p>
          </div>
          <button type="button" onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary">
            <X size={14} />
          </button>
        </div>

        {/* BOQ selector */}
        <div className="px-5 py-3 border-b border-border-light shrink-0">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-content-tertiary mb-1">
            {t('bim.target_boq', { defaultValue: 'Target BOQ' })}
          </label>
          <select
            value={selectedBOQId}
            onChange={(e) => setSelectedBOQId(e.target.value)}
            className="w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-1.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-oe-blue/40"
          >
            <option value="">{t('bim.select_boq', { defaultValue: '— select a BOQ —' })}</option>
            {boqs.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Category table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-surface-elevated border-b border-border-light">
              <tr>
                <th className="w-8 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={rows.every((r) => r.enabled)}
                    onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, enabled: e.target.checked })))}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-2 text-left font-semibold text-content-secondary">
                  {t('bim.category', { defaultValue: 'Category' })}
                </th>
                <th className="w-16 px-2 py-2 text-right font-semibold text-content-secondary">
                  {t('bim.count', { defaultValue: 'Count' })}
                </th>
                <th className="px-3 py-2 text-left font-semibold text-content-secondary">
                  {t('boq.description', { defaultValue: 'Description' })}
                </th>
                <th className="w-20 px-2 py-2 text-left font-semibold text-content-secondary">
                  {t('boq.unit', { defaultValue: 'Unit' })}
                </th>
                <th className="w-24 px-2 py-2 text-right font-semibold text-content-secondary">
                  {t('boq.quantity', { defaultValue: 'Quantity' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.elementType}
                  className={clsx(
                    'border-b border-border-light transition-colors',
                    row.enabled ? 'bg-surface-primary hover:bg-surface-secondary' : 'bg-surface-secondary/40 opacity-50',
                  )}
                >
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateRow(idx, { enabled: e.target.checked })}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-1.5 font-medium text-content-primary max-w-[180px] truncate" title={row.elementType}>
                    {row.elementType}
                  </td>
                  <td className="px-2 py-1.5 text-right text-content-secondary tabular-nums">
                    {row.elements.length.toLocaleString()}
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      disabled={!row.enabled}
                      className="w-full bg-transparent border-b border-transparent hover:border-border-medium focus:border-oe-blue focus:outline-none px-0 py-0 text-xs text-content-primary"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={row.unit}
                      onChange={(e) => handleUnitChange(idx, e.target.value)}
                      disabled={!row.enabled}
                      className="w-full bg-transparent border-b border-transparent hover:border-border-medium focus:border-oe-blue focus:outline-none text-xs text-content-primary"
                    >
                      <option value="pcs">pcs</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="lsum">lsum</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-content-primary">
                    {row.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-light flex items-center justify-between shrink-0 gap-3">
          <span className="text-xs text-content-tertiary">
            {enabledRows.length} {t('bim.categories_selected', { defaultValue: 'categories selected' })}
            {' · '}
            {enabledRows.reduce((s, r) => s + r.elements.length, 0).toLocaleString()} {t('bim.elements', { defaultValue: 'elements' })}
          </span>

          <div className="flex gap-2 items-center">
            {isRunning && progress && (
              <span className="text-xs text-content-secondary">
                {progress.done} / {progress.total}
              </span>
            )}
            <button type="button" onClick={onClose} disabled={isRunning} className="px-3 py-1.5 text-xs rounded-lg border border-border-medium text-content-secondary hover:bg-surface-secondary disabled:opacity-50">
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              disabled={isRunning || !selectedBOQId || enabledRows.length === 0}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-oe-blue text-white hover:bg-oe-blue-dark disabled:opacity-50 transition-colors"
            >
              {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {isRunning
                ? t('bim.creating_positions', { defaultValue: 'Creating…' })
                : t('bim.create_n_positions', { defaultValue: 'Create {{count}} positions', count: enabledRows.length })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

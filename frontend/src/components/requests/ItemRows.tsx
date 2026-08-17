import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { CatalogItem, RequestItemInput } from "@/lib/types/domain";

export function ItemRows({
  items,
  catalogItems,
  onChange,
}: {
  items: RequestItemInput[];
  catalogItems: CatalogItem[];
  onChange: (items: RequestItemInput[]) => void;
}) {
  const { t } = useTranslation();

  function update(index: number, patch: Partial<RequestItemInput>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...items, { catalogItemId: catalogItems[0]?.id ?? 0, quantity: 1, notes: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={item.catalogItemId}
            onChange={(e) => update(i, { catalogItemId: Number(e.target.value) })}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {catalogItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.sku} — {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => update(i, { quantity: Number(e.target.value) })}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={item.notes ?? ""}
            onChange={(e) => update(i, { notes: e.target.value })}
            placeholder={t("itemRows.notesPlaceholder")}
            className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button type="button" onClick={() => remove(i)} className="text-sm text-red-600">
            {t("itemRows.remove")}
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="self-start text-sm text-slate-600 underline-offset-2 hover:underline">
        {t("itemRows.addItem")}
      </button>
    </div>
  );
}

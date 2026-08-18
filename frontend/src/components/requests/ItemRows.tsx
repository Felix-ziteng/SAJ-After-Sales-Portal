import { useTranslation } from "@/lib/i18n/LocaleProvider";
import type { RequestItemInput } from "@/lib/types/domain";

export function ItemRows({
  items,
  onChange,
}: {
  items: RequestItemInput[];
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
    onChange([...items, { itemCode: "", name: "", quantity: 1, notes: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item.itemCode ?? ""}
            onChange={(e) => update(i, { itemCode: e.target.value })}
            placeholder={t("itemRows.itemCodePlaceholder")}
            className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            required
            value={item.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder={t("itemRows.namePlaceholder")}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => update(i, { quantity: Number(e.target.value) })}
            className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={item.notes ?? ""}
            onChange={(e) => update(i, { notes: e.target.value })}
            placeholder={t("itemRows.notesPlaceholder")}
            className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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

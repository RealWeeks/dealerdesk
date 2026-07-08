import { MessageTemplate } from "../models/MessageTemplate";
import { builtInInitialOutreachTemplates } from "./initialOutreachTemplates";

export async function seedBuiltInMessageTemplates({ dryRun = false } = {}) {
  const inserted = [];
  const updated = [];

  for (const template of builtInInitialOutreachTemplates) {
    const existing = await MessageTemplate.findOne({ userId: null, name: template.name, category: template.category });
    if (!existing) {
      inserted.push(template);
      if (!dryRun) await MessageTemplate.create({ ...template, userId: null });
      continue;
    }
    updated.push(template);
    if (!dryRun) {
      existing.set(template);
      existing.set("userId", null);
      await existing.save();
    }
  }

  return { inserted, updated, total: builtInInitialOutreachTemplates.length };
}

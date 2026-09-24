/**
 * Safely extracts a flat array of lowercase/trimmed skill names from various backend shapes:
 * - Array of strings: ['AWS', 'React']
 * - Array of objects: [{ name: 'AWS' }, { skill: 'React' }]
 * - Categorized Object: { languages: ['JavaScript', 'Python'], cloud: ['AWS'], tools: ['Docker'] }
 * - Null / undefined
 */
export function extractSkillList(skillsInput) {
  if (!skillsInput) return [];

  if (Array.isArray(skillsInput)) {
    return skillsInput
      .map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') return (item.name || item.skill || item.title || '').trim();
        return '';
      })
      .filter(Boolean);
  }

  if (typeof skillsInput === 'object') {
    const collected = [];
    Object.values(skillsInput).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (typeof item === 'string') collected.push(item.trim());
          else if (item && typeof item === 'object') collected.push((item.name || item.skill || '').trim());
        });
      } else if (typeof val === 'string' && val.trim()) {
        collected.push(val.trim());
      }
    });
    return collected.filter(Boolean);
  }

  if (typeof skillsInput === 'string') {
    return skillsInput.split(',').map(s => s.trim()).filter(Boolean);
  }

  return [];
}

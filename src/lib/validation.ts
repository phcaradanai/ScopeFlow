// Validation utilities for ScopeFlow Thai
// These run in the React frontend — no database required

/**
 * Validate a workspace path is reasonable
 */
export function validateWorkspacePath(path: string): { valid: boolean; error?: string } {
  if (!path || path.trim().length === 0) {
    return { valid: false, error: 'กรุณาเลือกตำแหน่งที่ตั้ง workspace' };
  }
  return { valid: true };
}

/**
 * Validate a slug (client-id, project-id) is kebab-case
 * Rules: lowercase, a-z, 0-9, hyphens only, no leading/trailing hyphens
 */
export function validateSlug(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'กรุณากรอกรหัส (ID)' };
  }

  const slug = id.trim();

  if (slug.length < 2) {
    return { valid: false, error: 'รหัสต้องมีอย่างน้อย 2 ตัวอักษร' };
  }

  if (slug.length > 64) {
    return { valid: false, error: 'รหัสต้องไม่เกิน 64 ตัวอักษร' };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: 'รหัสต้องเป็นตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น (เช่น acme-corp)',
    };
  }

  return { valid: true };
}

/**
 * Generate a slug from a Thai or English name
 */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove Thai characters (they can't be in file paths safely)
    .replace(/[\u0E00-\u0E7F]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Validate required fields in a data object
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Validate client data
 */
export function validateClientData(data: {
  name?: string;
  contact_person?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('กรุณากรอกชื่อลูกค้า / บริษัท');
  }

  if (!data.contact_person || data.contact_person.trim().length === 0) {
    errors.push('กรุณากรอกชื่อผู้ติดต่อ');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate project data
 */
export function validateProjectData(data: {
  name?: string;
  type?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validTypes = ['new-project', 'maintenance', 'support-contract'];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('กรุณากรอกชื่อโครงการ');
  }

  if (!data.type || !validTypes.includes(data.type)) {
    errors.push('กรุณาเลือกประเภทโครงการ');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

import type { OperatorDef, OperatorKind, RegexOperatorConfig, TextOperatorConfig } from '@/types'

export const OPERATOR_KINDS: { value: OperatorKind; label: string; hint: string }[] = [
  {
    value: 'text',
    label: 'Text parser',
    hint: 'HTML to text, case, trim, truncate. The flow chooses which text to read.',
  },
  {
    value: 'regex',
    label: 'Regex',
    hint: 'Test, extract, or replace. The flow chooses which text to read.',
  },
]

export function defaultOperatorConfig(kind: OperatorKind): OperatorDef['config'] {
  if (kind === 'regex') {
    return { pattern: '', flags: '', mode: 'extract', replacement: '' }
  }
  return { operation: 'html-to-text', maxLength: 200 }
}

export function validateOperatorConfig(
  kind: OperatorKind,
  config: OperatorDef['config'],
): string | null {
  if (kind === 'regex') {
    const c = config as RegexOperatorConfig
    if (!c.pattern) return 'Pattern is required.'
    try {
      new RegExp(c.pattern, c.flags)
    } catch {
      return 'Invalid regular expression.'
    }
    return null
  }
  const c = config as TextOperatorConfig
  if (c.operation === 'truncate' && !(c.maxLength && c.maxLength > 0)) {
    return 'Max length must be a positive number.'
  }
  return null
}

export function summarizeOperatorConfig(op: OperatorDef): string {
  if (op.kind === 'regex') {
    const c = op.config as RegexOperatorConfig
    const repl = c.mode === 'replace' ? ` → ${c.replacement || '…'}` : ''
    return `${c.mode} /${c.pattern || '…'}/${c.flags || ''}${repl}`
  }
  const c = op.config as TextOperatorConfig
  return c.operation === 'truncate' ? `truncate (${c.maxLength ?? '…'})` : c.operation
}

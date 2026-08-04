export const cn = (...c: (string | undefined | null | false)[]) => c.filter(Boolean).join(' ')

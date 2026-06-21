export type UserId = string & { readonly _brand: 'UserId' }

export const UserId = {
  fromString: (id: string): UserId => {
    if (!id || id.trim().length === 0) throw new Error('UserId cannot be empty')
    return id as UserId
  },
  toString: (id: UserId): string => id,
}

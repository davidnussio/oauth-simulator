/** basePath del sito (es. "/oauth-simulator" su GitHub Pages, "" in locale). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export const withBase = (path: string) => (path.startsWith("/") ? BASE_PATH + path : path)

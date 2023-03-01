export default function parsePath(path: string, removeSingleSlash?: boolean) {
	path = path.replaceAll(/\/{2,}/g, '/')

	if (path.endsWith('/') && path !== '/') path = path.slice(0, -1)
	if (!path.startsWith('/') && path !== '/') path = `/${path}`
	if (path.includes('/?')) path = path.replace('/?', '?')

	return ((removeSingleSlash && path === '/') ? '' : path)
}
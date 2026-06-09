const AV_COLORS = ['mp-av-1','mp-av-2','mp-av-3','mp-av-4','mp-av-5','mp-av-6']
const AV_BG     = ['#FCA5A5','#93C5FD','#FCD34D','#5EEAD4','#C4B5FD','#FDA4AF']

function idx(name) { return (name?.charCodeAt(0) ?? 0) % AV_COLORS.length }

export function avatarColor(name) { return AV_COLORS[idx(name)] }
export function avatarBg(name)    { return AV_BG[idx(name)] }

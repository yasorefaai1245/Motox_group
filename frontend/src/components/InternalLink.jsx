import { navigateTo } from '../hooks/useAppLocation.js'

export default function InternalLink({ href, onClick, target, ...props }) {
  const handleClick = (event) => {
    onClick?.(event)
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || target && target !== '_self'
    ) {
      return
    }

    event.preventDefault()
    navigateTo(href)
  }

  return <a {...props} href={href} target={target} onClick={handleClick} />
}

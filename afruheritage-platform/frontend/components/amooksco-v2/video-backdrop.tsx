type VideoBackdropProps = {
  /** Path(s) to the mp4 source(s). */
  src: string
  /** Poster image shown before/while the video loads. */
  poster?: string
  /**
   * Tailwind opacity utility for the video layer, e.g. "opacity-20".
   * Kept subtle so the video reads as ambient motion, not the main content.
   */
  videoClassName?: string
  /** Overlay classes — usually a translucent brand wash for legibility. */
  overlayClassName?: string
}

/**
 * Ambient, muted, looping video used as a cinematic shadow layer behind
 * content. The video is intentionally low-opacity and paired with a
 * translucent overlay so foreground text stays readable.
 */
export function VideoBackdrop({
  src,
  poster,
  videoClassName = "opacity-20",
  overlayClassName,
}: VideoBackdropProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        className={`absolute inset-0 size-full object-cover ${videoClassName}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>
      {overlayClassName ? <div className={`absolute inset-0 ${overlayClassName}`} /> : null}
    </div>
  )
}

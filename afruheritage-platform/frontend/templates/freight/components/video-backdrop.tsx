type VideoBackdropProps = {
  src?: string
  poster?: string
  videoClassName?: string
  overlayClassName?: string
}

export function VideoBackdrop({
  src,
  poster,
  videoClassName = "opacity-30",
  overlayClassName = "bg-gradient-to-r from-primary via-primary/85 to-primary/55",
}: VideoBackdropProps) {
  if (!src) return null

  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        className={`absolute inset-0 h-full w-full object-cover ${videoClassName}`}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={`pointer-events-none absolute inset-0 ${overlayClassName}`} />
    </>
  )
}

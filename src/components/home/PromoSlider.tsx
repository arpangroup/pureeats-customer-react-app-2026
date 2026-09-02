import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { classNames } from '@/lib/format'
import type { PromoSlide } from '@/types/entities'

const AUTO_ADVANCE_MS = 4500

/** Home page banner — shows exactly one slide at a time (per design), auto-advancing through the rest with a dot indicator, matching the reference screenshot. */
export function PromoSlider({ slides }: { slides: PromoSlide[] }) {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [slides.length])

  if (slides.length === 0) return null
  const slide = slides[index % slides.length]

  function handleClick() {
    if (!slide.url) return
    if (/^https?:\/\//.test(slide.url)) {
      window.location.href = slide.url
    } else {
      navigate(slide.url)
    }
  }

  return (
    <section className="mb-6">
      <button
        onClick={handleClick}
        disabled={!slide.url}
        className="block w-full overflow-hidden rounded-2xl bg-slate-100 disabled:cursor-default dark:bg-slate-800"
        aria-label={slide.name}
      >
        <img src={slide.image} alt={slide.name} className="aspect-[2/1] w-full object-cover sm:aspect-[3/1]" />
      </button>
      {slides.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <span
              key={s.id}
              className={classNames('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-brand-600' : 'w-1.5 bg-slate-300 dark:bg-slate-700')}
            />
          ))}
        </div>
      )}
    </section>
  )
}

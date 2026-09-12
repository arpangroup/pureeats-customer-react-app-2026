import { LifeBuoy, Mail } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { pageService } from '@/services/pageService'

/** Fetches an admin-authored "support" CMS page (see the admin panel's Pages editor, same GET
 * /pages/{slug} Terms/Privacy would use); falls back to a generic contact prompt when no admin has
 * authored one yet, rather than a dead end. */
export default function SupportPage() {
  const { data: page, isLoading } = useAsync(() => pageService.getBySlug('support'), [])

  return (
    <div>
      <PageHeader title="Support" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <LoadingBlock />
        ) : page ? (
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">{page.name}</h2>
            {/* Admin-authored content from the Pages editor — same trust boundary as Terms/Privacy would use. */}
            <div
              className="space-y-3 text-sm leading-relaxed text-slate-600 [&_a]:text-brand-600 [&_a]:underline [&_strong]:font-semibold dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </div>
        ) : (
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <LifeBuoy size={24} />
            </span>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Need help with an order?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Reach out to us and we'll get back to you as soon as possible.
            </p>
            <a href="mailto:support@pureeats.local" className="btn-primary mt-2 flex w-full items-center justify-center gap-2">
              <Mail size={16} /> Email support
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

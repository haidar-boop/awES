import Link from 'next/link';
import { ARTICLES } from '@/lib/content/articles';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AdminArticles() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Articles ({ARTICLES.length})</h1>
      <p className="mt-1 text-sm text-stone-500">
        Launch articles ship as version-controlled content (<code className="font-mono">lib/content/articles-*.ts</code>)
        and are mirrored into the <code className="font-mono">articles</code> table by the seed script; DB rows
        take precedence for admin edits. See DECISIONS.md #10.
      </p>
      <div className="mt-6 space-y-3">
        {ARTICLES.map((a) => (
          <div key={a.slug} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">{a.title}</p>
              <p className="text-sm text-stone-500">
                /guides/{a.slug} · {a.minutes} min · updated {formatDate(a.updated)} · {a.faq.length} FAQ entries
              </p>
            </div>
            <Link href={`/guides/${a.slug}`} className="btn-secondary !py-1.5 text-sm">
              View live →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

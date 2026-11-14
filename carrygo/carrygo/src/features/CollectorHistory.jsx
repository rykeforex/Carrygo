import React, { useCallback, useEffect, useState } from "react";
import { PackageOpen, Star } from "lucide-react";
import { LoadingBlock, ErrorBlock, EmptyBlock } from "../components/StateViews";
import { getMyStats, listCompletedJobs, listMyReviews } from "../lib/api";
import { friendlyError } from "../lib/errors";
import { formatDateTime, formatMoney } from "../lib/format";

export default function CollectorHistory({ profile }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [stats, jobs, reviews] = await Promise.all([getMyStats(), listCompletedJobs(profile.id), listMyReviews()]);
      setData({ stats, jobs, reviews }); setError("");
    } catch (e) { setError(friendlyError(e, "We couldn't load your history.")); }
  }, [profile.id]);
  useEffect(() => { load(); }, [load]);

  return (
    <section className="cg-page cg-page-wide">
      <div className="cg-page-head">
        <h1>History</h1>
        <p className="cg-page-lede">Your completed jobs and the ratings customers have left. Customer names and addresses aren't kept here.</p>
      </div>
      {error && !data && <ErrorBlock message={error} onRetry={load} />}
      {!data && !error && <LoadingBlock />}
      {data && (
        <>
          {data.stats && (
            <>
              <div className="cg-earnings-row">
                <div className="cg-earnings-card glass"><span className="cg-hero-card-label">Jobs completed</span><strong>{data.stats.completed_jobs}</strong></div>
                <div className="cg-earnings-card glass"><span className="cg-hero-card-label">Total job value</span><strong>{formatMoney(data.stats.total_job_value)}</strong></div>
                <div className="cg-earnings-card glass"><span className="cg-hero-card-label">Estimated earnings</span><strong>{formatMoney(data.stats.estimated_earnings)}</strong></div>
              </div>
              {!data.stats.commission_approved && <p className="cg-field-hint">Estimated earnings use a provisional {data.stats.commission_bps / 100}% commission that CarryGo hasn't approved. Payouts aren't live yet.</p>}
            </>
          )}
          <div className="cg-detail-grid">
            <div className="cg-detail-col">
              <h3 className="cg-col-title">Completed jobs</h3>
              {data.jobs.length === 0 && <EmptyBlock icon={PackageOpen} title="No completed jobs yet">Finished jobs will appear here.</EmptyBlock>}
              {data.jobs.map((j) => (
                <div key={j.id} className="cg-detail-card glass">
                  <div className="cg-pickup-card-top"><strong>{j.reference}</strong><span className="cg-pickup-date">{formatDateTime(j.completed_at)}</span></div>
                  <div className="cg-pickup-card-bottom"><span>{j.waste_categories?.label} × {j.quantity}</span><strong>{formatMoney(j.final_price, j.currency)}</strong></div>
                </div>
              ))}
            </div>
            <div className="cg-detail-col">
              <h3 className="cg-col-title">Ratings</h3>
              {data.reviews.length === 0 && <EmptyBlock icon={Star} title="No ratings yet">Customers can rate you after a completed pickup.</EmptyBlock>}
              {data.reviews.map((r, i) => (
                <div key={i} className="cg-detail-card glass">
                  <div className="cg-pickup-stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={15} fill={n <= r.rating ? "currentColor" : "none"} className={n <= r.rating ? "cg-star-filled" : "cg-star-empty"} />)}</div>
                  {r.comment && <p className="cg-pickup-comment">&ldquo;{r.comment}&rdquo;</p>}
                  <p className="cg-field-hint">{formatDateTime(r.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

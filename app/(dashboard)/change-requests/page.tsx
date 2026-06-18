import { PageHeader } from "@/components/page-header";
import {
  reviewChangeRequest,
  submitChangeRequest,
} from "@/app/(dashboard)/actions";
import { getChangeRequests, getCurrentContext } from "@/lib/data";

export default async function ChangeRequestsPage() {
  const [context, requests] = await Promise.all([
    getCurrentContext(),
    getChangeRequests(),
  ]);
  return (
    <>
      <PageHeader
        description="Viewers can propose inventory changes. Only an Admin approval function can apply them to production records."
        eyebrow="Controlled changes"
        title="Change requests"
      />
      {context?.role === "viewer" && (
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <summary className="cursor-pointer font-semibold text-slate-950">
            Submit a change request
          </summary>
          <form action={submitChangeRequest} className="mt-5 space-y-4">
            <input
              className="form-input"
              name="title"
              placeholder="Short request title"
              required
            />
            <textarea
              className="form-input min-h-28 py-3"
              name="description"
              placeholder="Describe the requested inventory or network change"
              required
            />
            <button className="primary-button" type="submit">
              Submit for approval
            </button>
          </form>
        </details>
      )}
      <div className="mt-8 space-y-4">
        {requests.length === 0 ? (
          <div className="empty-state">No change requests.</div>
        ) : (
          requests.map((request) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6"
              key={request.id}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {request.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {request.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Requested by {request.requested_by_name} ·{" "}
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">
                    {request.status}
                  </span>
                  {context?.role === "admin" &&
                    request.status === "pending" && (
                      <form action={reviewChangeRequest} className="flex gap-2">
                        <input name="id" type="hidden" value={request.id} />
                        <button
                          className="small-button"
                          name="decision"
                          type="submit"
                          value="approved"
                        >
                          Approve
                        </button>
                        <button
                          className="small-button"
                          name="decision"
                          type="submit"
                          value="rejected"
                        >
                          Reject
                        </button>
                      </form>
                    )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}

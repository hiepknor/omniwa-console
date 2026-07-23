import { Link } from 'react-router-dom';

export function ActionRequiredState() {
  return (
    <section className="overview-actions" aria-labelledby="overview-actions-title">
      <div className="overview-section-label"><span>Action required</span><span>Not reported</span></div>
      <div className="overview-neutral-state">
        <span className="overview-neutral-mark" aria-hidden="true" />
        <div>
          <h2 id="overview-actions-title">No consolidated action queue is available.</h2>
          <p>The public API does not expose a dedicated action-required read. Review grouped health above and use the resource panels for investigation.</p>
        </div>
      </div>
      <div className="overview-action-footer"><span>Unavailable data is not treated as an empty queue.</span><Link className="btn" to="/instances">Review instances</Link></div>
    </section>
  );
}

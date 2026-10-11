import { useMockStore } from '@/store/MockStore'

const PLANS = [
  {
    id: 'community',
    name: 'Community',
    tagline: 'For local operators',
    price: 'Free',
    priceNote: null as string | null,
    includesLabel: 'Includes:',
    features: [
      'Up to 2 Webhooks',
      'Up to 2 API keys per webhook',
      'Single local administrator',
      'Up to 3 HTTP Flows per webhook',
      'Free connection catalog and fallback order',
      'Allowed clients (domains / IPs)',
      'Local gateway base URL',
    ],
    cta: 'Current plan',
    ctaVariant: 'secondary' as const,
    current: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'For growing apps',
    price: '$5',
    priceNote: '/mo.',
    includesLabel: 'Everything in Community, plus:',
    features: [
      'Up to 10 Webhooks',
      'Unlimited API keys per webhook',
      'Basic request analytics',
      'Email alerts on failures & quota',
      'More HTTP Flows per webhook',
      'Exportable usage reports',
    ],
    cta: 'Upgrade to Standard',
    ctaVariant: 'primary' as const,
    current: false,
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For teams that ship together',
    price: '$10',
    priceNote: '/mo.',
    includesLabel: 'Everything in Standard, plus:',
    features: [
      'Unlimited Webhooks',
      'Role-based access control (RBAC)',
      'Shared team webhooks',
      'Centralized billing',
      'Audit log & activity export',
      'High availability gateway',
      'SSO (SAML / OIDC)',
    ],
    cta: 'Upgrade to Team',
    ctaVariant: 'secondary' as const,
    current: false,
  },
]

export function UpgradePage() {
  const { pushToast } = useMockStore()

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Upgrade</h1>
          <p>Choose a plan. Upgrades are mock-only in this demo.</p>
        </div>
      </div>

      <div className="plan-grid">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`plan-card${plan.current ? ' plan-card-current' : ''}`}
          >
            <div className="plan-card-body">
              <div>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-tagline">{plan.tagline}</p>
              </div>
              <div className="plan-price">
                <span className="plan-price-amount">{plan.price}</span>
                {plan.priceNote ? (
                  <span className="plan-price-note">{plan.priceNote}</span>
                ) : null}
              </div>
              <div className="plan-features">
                <p className="plan-includes">{plan.includesLabel}</p>
                <ul className="feature-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              className={`btn plan-cta${plan.ctaVariant === 'primary' ? ' plan-cta-primary' : ''}`}
              disabled={plan.current}
              onClick={() =>
                pushToast('info', `${plan.name} upgrade is mock-only in this demo.`)
              }
            >
              {plan.cta}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

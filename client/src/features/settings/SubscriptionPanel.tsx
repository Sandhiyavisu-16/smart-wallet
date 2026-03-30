import { useAuthStore } from '../../store';
import { TIER_LIMITS } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { SubscriptionTier } from '../../types';

const TIER_COLORS: Record<SubscriptionTier, 'default' | 'info' | 'warning'> = {
  FREE: 'default',
  PRO: 'info',
  PREMIUM: 'warning',
};

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = !isFinite(limit);
  const pct = isUnlimited ? 0 : limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  let barColor = 'bg-primary-500';
  if (pct >= 90) barColor = 'bg-red-500';
  else if (pct >= 70) barColor = 'bg-amber-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[var(--color-text)]">{label}</span>
        <span className="text-[var(--color-text-secondary)]">
          {used} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      <div className="w-full h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isUnlimited ? 'bg-green-500 w-0' : barColor}`}
          style={{ width: isUnlimited ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionPanel() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const limits = TIER_LIMITS[user.tier];

  return (
    <div className="space-y-6 max-w-lg">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold">Current Plan</h3>
          <Badge variant={TIER_COLORS[user.tier]}>{user.tier}</Badge>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {user.tier === 'FREE' && 'Get started with basic features. Upgrade for more power.'}
          {user.tier === 'PRO' && 'Enjoy extended limits and investment tracking.'}
          {user.tier === 'PREMIUM' && 'You have full access to all SmartWallet features.'}
        </p>

        <div className="space-y-4">
          <UsageMeter
            label="AI Queries"
            used={user.aiQueriesUsed}
            limit={limits.aiQueries}
          />
          {/* Goals and budgets counts would come from a usage endpoint;
              showing limit info for now */}
          <UsageMeter
            label="Savings Goals"
            used={0}
            limit={limits.goals}
          />
          <UsageMeter
            label="Budgets"
            used={0}
            limit={limits.budgets}
          />
        </div>
      </div>

      {user.tier !== 'PREMIUM' && (
        <div className="card border-primary-500 border-2">
          <h3 className="text-lg font-semibold mb-2">
            {user.tier === 'FREE' ? 'Upgrade to PRO' : 'Upgrade to PREMIUM'}
          </h3>
          <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 mb-4">
            {user.tier === 'FREE' ? (
              <>
                <li>- Unlimited budgets and goals</li>
                <li>- 100 AI advisor queries per month</li>
                <li>- Investment portfolio tracking</li>
                <li>- Advanced analytics</li>
              </>
            ) : (
              <>
                <li>- Unlimited AI advisor queries</li>
                <li>- Priority support</li>
                <li>- Advanced financial reports</li>
                <li>- Data export</li>
              </>
            )}
          </ul>
          <Button>
            Upgrade to {user.tier === 'FREE' ? 'PRO' : 'PREMIUM'}
          </Button>
        </div>
      )}
    </div>
  );
}

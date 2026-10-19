import { useState } from 'react';
import type { TelegramUser } from '../../telegram/telegram';
import { getInitials } from '../../telegram/telegram';
import { cn } from '../../lib/cn';

export function UserAvatar({
  user,
  size = 36,
  className,
}: {
  user: TelegramUser | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const photo = user?.photo_url;

  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border-accent)] bg-[var(--accent-dim)] font-mono font-semibold text-[var(--accent)]',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {photo && !failed ? (
        <img
          src={photo}
          alt={user?.first_name ?? 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        getInitials(user)
      )}
    </div>
  );
}

"use client";

import { AlertCircle, AlertTriangle, Check, Star, XOctagon } from "lucide-react";
import { Button, Card, type ButtonVariant } from "@/components/ui";
import { formatEval } from "@/lib/chess/eval-format";
import { MOVE_QUALITY_LABEL, type MoveQuality } from "@/lib/chess/review";
import type { MoveAnnotation } from "@/lib/chess/annotate";

const QUALITY_ICON: Record<MoveQuality, typeof Star> = {
  best: Star,
  good: Check,
  inaccuracy: AlertCircle,
  mistake: AlertTriangle,
  blunder: XOctagon,
};

const QUALITY_SUFFIX: Record<MoveQuality, string> = {
  best: "",
  good: "",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

export type CoachCardAction = { label: string; onClick: () => void; variant?: ButtonVariant };

export type CoachCardProps = {
  annotation?: MoveAnnotation | null;
  loading?: boolean;
  error?: string | null;
  title?: string;
  body?: string;
  actions?: CoachCardAction[];
  showRawEval?: boolean;
};

export function CoachCard({
  annotation,
  loading = false,
  error = null,
  title,
  body,
  actions = [],
  showRawEval = false,
}: CoachCardProps) {
  if (loading) {
    return (
      <Card className="coach-card coach-card-loading" aria-live="polite">
        <div className="coach-card-skeleton-line" />
        <div className="coach-card-skeleton-line coach-card-skeleton-line-short" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="coach-card" aria-live="polite">
        <p className="coach-card-error">{error}</p>
        {actions.length > 0 ? (
          <div className="coach-card-actions">
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant ?? "secondary"} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>
    );
  }

  if (!annotation) {
    return (
      <Card className="coach-card" aria-live="polite">
        {title ? <strong>{title}</strong> : null}
        {body ? <p>{body}</p> : null}
        {actions.length > 0 ? (
          <div className="coach-card-actions">
            {actions.map((action) => (
              <Button key={action.label} variant={action.variant ?? "secondary"} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>
    );
  }

  const Icon = QUALITY_ICON[annotation.quality];
  const suffix = QUALITY_SUFFIX[annotation.quality];

  return (
    <Card className="coach-card" aria-live="polite">
      <div className="coach-card-header">
        <span className={`quality-pill quality-${annotation.quality}`}>
          <Icon size={14} />
          {MOVE_QUALITY_LABEL[annotation.quality]}
        </span>
        <strong className="coach-card-move">
          {annotation.ply % 2 === 1 ? `${Math.ceil(annotation.ply / 2)}. ` : `${Math.ceil(annotation.ply / 2)}... `}
          {annotation.san}
          {suffix}
        </strong>
      </div>

      <p className="coach-card-reason">{annotation.reason}</p>

      {annotation.bestMoveSan ? (
        <p className="coach-card-best">
          Better: <strong>{annotation.bestMoveSan}</strong>
        </p>
      ) : null}

      {showRawEval ? (
        <p className="coach-card-eval">
          Eval: {formatEval(annotation.before.evalCp, annotation.before.mate)} →{" "}
          {formatEval(annotation.after.evalCp, annotation.after.mate)}
        </p>
      ) : null}

      {actions.length > 0 ? (
        <div className="coach-card-actions">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant ?? "secondary"} onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

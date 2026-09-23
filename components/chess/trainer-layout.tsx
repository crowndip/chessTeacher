import type { ReactNode } from "react";

export type TrainerLayoutProps = {
  winBar: ReactNode;
  board: ReactNode;
  belowBoard?: ReactNode;
  coach: ReactNode;
  sidebar?: ReactNode;
};

export function TrainerLayout({ winBar, board, belowBoard, coach, sidebar }: TrainerLayoutProps) {
  return (
    <div className="trainer">
      <div className="trainer-winbar">{winBar}</div>
      <div className="trainer-board-column">
        <div className="trainer-board">{board}</div>
        {belowBoard ? <div className="trainer-below-board">{belowBoard}</div> : null}
      </div>
      <div className="trainer-sidebar-column">
        <div className="trainer-coach">{coach}</div>
        {sidebar ? <div className="trainer-sidebar">{sidebar}</div> : null}
      </div>
    </div>
  );
}

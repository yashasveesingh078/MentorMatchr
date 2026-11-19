// Shows how many of the 3 team slots a mentor is using.
export const MAX_TEAMS = 3; // same limit as the backend

export default function CapacityBar({ used }) {
  const percent = Math.min(used / MAX_TEAMS, 1) * 100;

  let colour = 'green';
  if (used >= MAX_TEAMS) colour = 'red';
  else if (used === MAX_TEAMS - 1) colour = 'orange';

  return (
    <div className="capacity">
      <div className="capacity-track">
        <div className={'capacity-fill fill-' + colour} style={{ width: percent + '%' }} />
      </div>
      <span>{used} / {MAX_TEAMS}</span>
    </div>
  );
}
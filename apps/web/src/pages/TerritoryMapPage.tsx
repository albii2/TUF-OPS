import { TerritoryCommandMap } from '../components/TerritoryCommandMap';

export function TerritoryMapPage() {
  return (
    <div className="space-y-3">
      <TerritoryCommandMap title="TERRITORY FOCUS VIEW" fullMapLink={false} />
    </div>
  );
}

import { RecordNotFoundState } from "@/components/state/record-not-found-state";

export default function NotFound() {
  return <RecordNotFoundState recordLabel="Opportunity" backHref="/opportunities" />;
}

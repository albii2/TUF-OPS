import { RecordNotFoundState } from "@/components/state/record-not-found-state";

export default function NotFound() {
  return <RecordNotFoundState recordLabel="Organization" backHref="/organizations" />;
}

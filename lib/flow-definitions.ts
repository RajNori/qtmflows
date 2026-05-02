export type FlowDefinition = {
  id: string;
  file: string;
  title: string;
  shortLabel: string;
};

/** Ordered list matching the static flow fragments in /public/flows */
export const FLOWS: readonly FlowDefinition[] = [
  {
    id: "onboarding",
    file: "flow-01-onboarding.html",
    title: "1 · Onboarding",
    shortLabel: "Onboarding",
  },
  {
    id: "post-job",
    file: "flow-02-post-job.html",
    title: "2 · Post a job",
    shortLabel: "Post a job",
  },
  {
    id: "match",
    file: "flow-03-match.html",
    title: "3 · Match & accept",
    shortLabel: "Match & accept",
  },
  {
    id: "service",
    file: "flow-04-service.html",
    title: "4 · Service delivery",
    shortLabel: "Service delivery",
  },
  {
    id: "chat",
    file: "flow-05-chat.html",
    title: "5 · Real-time chat",
    shortLabel: "Chat",
  },
  {
    id: "payments",
    file: "flow-06-payments.html",
    title: "6 · Payments & escrow",
    shortLabel: "Payments",
  },
  {
    id: "disputes",
    file: "flow-07-disputes.html",
    title: "7 · Disputes",
    shortLabel: "Disputes",
  },
  {
    id: "admin",
    file: "flow-08-admin.html",
    title: "8 · Admin ops",
    shortLabel: "Admin",
  },
  {
    id: "notifications",
    file: "flow-09-notifications.html",
    title: "9 · Notifications",
    shortLabel: "Notifications",
  },
  {
    id: "state",
    file: "flow-10-state.html",
    title: "10 · Job state machine",
    shortLabel: "State machine",
  },
  {
    id: "journey",
    file: "flow-11-journey.html",
    title: "11 · Journey map",
    shortLabel: "Journey map",
  },
  {
    id: "blueprint",
    file: "flow-12-blueprint.html",
    title: "12 · Service blueprint",
    shortLabel: "Blueprint",
  },
] as const;

export function getFlowById(id: string | null): FlowDefinition | undefined {
  if (!id) return undefined;
  return FLOWS.find((f) => f.id === id);
}

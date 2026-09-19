import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/parish")({ component: ParishLayout });

function ParishLayout() {
  return <Outlet />;
}

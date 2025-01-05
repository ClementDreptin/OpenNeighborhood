import AddConsoleButton from "@/components/add-console-button";
import ConsoleButton from "@/components/console-button";
import ErrorPage from "@/components/error-page";
import { getConsoles } from "@/lib/consoles";

export default async function Home() {
  let consoles;
  try {
    consoles = await getConsoles();
  } catch (err) {
    return <ErrorPage error={err} />;
  }

  return (
    <div className="flex h-full flex-wrap gap-4">
      <AddConsoleButton />

      {consoles.map((console) => (
        <ConsoleButton key={console.ipAddress} console={console} />
      ))}
    </div>
  );
}
